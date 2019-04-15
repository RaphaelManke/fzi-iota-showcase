import { Vehicle } from './vehicle';
import { Mover } from './mover';
import { Path } from './pathFinder';
import { Trytes, Hash, Bundle } from '@iota/core/typings/types';
import { API, composeAPI, AccountData } from '@iota/core';
import { trits, trytes } from '@iota/converter';
import {
  createAttachToTangle,
  CheckInMessage,
  FlashMock,
  StopWelcomeMessage,
  Exception,
  log,
} from 'fzi-iota-showcase-client';
import {
  createMasterChannel,
  addMetaInfo,
  publishMetaInfoRoot,
  publishCheckIn,
  getPaymentSeed,
  BoardingHandler,
  Sender,
} from 'fzi-iota-showcase-vehicle-client';
import { RAAM } from 'raam.client.js';
import Kerl from '@iota/kerl';
import { State } from './tripState';
import { getPathLength, getDistance } from 'geolib';
import { MamWriter, MAM_MODE } from 'mam.ts';
import { Observer } from './observer';

export class VehicleMock {
  private mover: Mover;
  private masterChannel?: RAAM;
  private currentAddress?: Hash;
  private nextAddress?: Hash;

  constructor(
    private vehicle: Vehicle,
    private capacity: number,
    private pricePerMeter: number,
    private reservationsRate: number,
    private provider: string,
    private iota: API = composeAPI({
      provider,
      attachToTangle: createAttachToTangle(),
    }),
    private depth = 3,
    private mwm = 14,
    private mockPayments = false,
    private mockMessages = false,
  ) {
    this.mover = new Mover(vehicle);
  }

  public async setupPayments(): Promise<AccountData> {
    if (!this.mockPayments) {
      const seed = trytes(getPaymentSeed(this.vehicle.seed));
      const result = await this.iota.getNewAddress(seed);
      if (typeof result === 'string') {
        this.currentAddress = result;
      } else {
        this.currentAddress = result[0];
        this.nextAddress = result[1];
      }
      return await this.iota.getAccountData(seed);
    } else {
      this.currentAddress = 'A';
      this.nextAddress = 'B';
      return {
        addresses: [''],
        balance: 3000,
        latestAddress: 'A',
        transactions: [],
        inputs: [],
        transfers: [],
      };
    }
  }

  public async syncTangle() {
    if (!this.mockMessages) {
      this.masterChannel = await createMasterChannel(
        this.iota,
        this.vehicle.seed,
        this.capacity,
      );
      await this.masterChannel.syncChannel();
      if (this.masterChannel.cursor === 0) {
        // publish meta info
        const { root } = await addMetaInfo(
          this.provider,
          this.vehicle.seed,
          this.vehicle.info,
        );
        await publishMetaInfoRoot(this.masterChannel, root);
      }
    }
  }

  public async checkInAtCurrentStop() {
    if (this.vehicle.stop) {
      if (!this.masterChannel) {
        await this.syncTangle();
      }
      if (!this.currentAddress) {
        await this.setupPayments();
      }

      const nonce = this.generateNonce();
      const checkInMessage: CheckInMessage = {
        hashedNonce: this.hash(nonce),
        vehicleId: this.mockMessages
          ? trits(this.vehicle.seed)
          : this.masterChannel!.channelRoot,
        vehicleInfo: this.vehicle.info,
        tripChannelIndex: this.mockMessages ? 1 : this.masterChannel!.cursor,
        reservationRate: this.reservationsRate,
        price: this.pricePerMeter,
        paymentAddress: this.currentAddress!,
      };
      let result: {
        reservationChannel: MamWriter;
        tripChannel: RAAM;
        welcomeMessage: StopWelcomeMessage;
      };
      if (!this.mockMessages) {
        result = await publishCheckIn(
          this.provider,
          this.vehicle.seed,
          this.masterChannel!,
          this.vehicle.stop,
          checkInMessage,
        );
      } else {
        result = {
          reservationChannel: new MamWriter(
            '',
            'Z'.repeat(81),
            MAM_MODE.PUBLIC,
          ),
          tripChannel: await RAAM.fromSeed('9', { amount: 2 }),
          welcomeMessage: {
            checkInMessageRef: '',
            tripChannelId: new Int8Array(0),
          },
        };
      }
      this.vehicle.trip = {
        ...result,
        nonce,
        state: State.CHECKED_IN,
        checkInMessage,
        stop: this.vehicle.stop,
        reservations: [],
      };
    }
  }

  public async startTrip(
    path: Path,
    sendToUser: Sender,
    userId: Trytes,
    setSentVehicleHandler: (handler: BoardingHandler) => void,
    onStop?: (stop: Trytes) => void,
  ): Promise<Trytes> {
    if (this.vehicle.trip) {
      if (this.vehicle.stop === path.connections[0].from) {
        const distance = getPathLength(
          path.waypoints.map((pos) => ({
            latitude: pos.lat,
            longitude: pos.lng,
          })),
        );

        const price = this.pricePerMeter * distance;

        // use real or mocked payment functions
        let depositor: (value: number, address: Hash) => Promise<string>;
        let txReader: (bundleHash: Hash) => Promise<Bundle>;
        if (this.mockPayments) {
          depositor = async (value, address) => '';
          txReader = async (bundleHash) => this.mockedBundle(price);
        } else {
          depositor = async (value, address) => {
            const txTrytes = await this.iota.prepareTransfers(
              this.vehicle.seed,
              [{ value, address }],
            );
            const txs = await this.iota.sendTrytes(
              txTrytes,
              this.depth,
              this.mwm,
            );
            return txs[0].bundle;
          };
          txReader = async (bundleHash) => await this.iota.getBundle(bundleHash);
        }

        return new Promise<Trytes>((res, rej) => {
          // observe sender
          let o: Observer;
          const senderProxy = this.createSenderProxy(
            sendToUser,
            userId,
            path,
            price,
            () => this.vehicle.removeObserver(o),
            res,
            rej,
            onStop,
          );

          const b = new BoardingHandler(
            this.vehicle.trip!.nonce,
            this.vehicle.trip!.reservations,
            this.nextAddress!,
            this.pricePerMeter,
            this.vehicle.info.speed,
            () => ({ price, distance }),
            depositor,
            txReader,
            new FlashMock(),
            senderProxy,
          );
          setSentVehicleHandler(b);

          let lastPosition = this.vehicle.position;
          o = {
            posUpdated(position) {
              const add = getDistance(
                { latitude: lastPosition.lat, longitude: lastPosition.lng },
                { latitude: position.lat, longitude: position.lng },
              );
              lastPosition = position;
              b.addMetersDriven(add);
            },
            checkedIn() {},
            reachedStop() {},
            transactionReceived() {},
            tripStarted() {},
          };
          this.vehicle.addObserver(o);

          try {
            b.onTripRequested();
          } catch (e) {
            log.error('Boarding failed', e);
            rej(new Exception('Boarding failed', e));
          }
        });
      } else {
        throw new Error('Vehicle is not at the start of the given path');
      }
    } else {
      throw new Error('Vehicle is not checked in.');
    }
  }

  public stopTripAtNextStop() {
    return this.mover.stopDrivingAtNextStop();
  }

  private createSenderProxy(
    sendToUser: Sender,
    userId: Trytes,
    path: Path,
    price: number,
    removeObserver: () => void,
    res: (result: any) => void,
    rej: (reason: any) => void,
    onStop?: (stop: Trytes) => void,
  ): Sender {
    let departed = false;
    const vehicle = this.vehicle;
    const mover = this.mover;

    return {
      authenticate(nonce, sendAuth) {
        sendToUser.authenticate(nonce, sendAuth);
      },
      priced(price) {
        sendToUser.priced(price);
      },
      openPaymentChannel(...args) {
        sendToUser.openPaymentChannel(...args);
      },
      depositSent(hash, amount) {
        sendToUser.depositSent(hash, amount);
      },
      signedTransaction(signedBundles, value, close) {
        if (!close) {
          vehicle.transactionReceived(userId, value);
        }
        sendToUser.signedTransaction(signedBundles, value, close);
      },
      creditsLeft(amount, distanceLeft, millis) {
        if (!departed && amount > 0) {
          vehicle.trip!.state = State.DEPARTED;
          departed = true;
          mover
            .startDriving(path, (stop) => {
              vehicle.stop = stop;
              if (onStop) {
                onStop(stop);
              }
            })
            .then((stop) => {
              vehicle.trip!.state = State.FINISHED;
              removeObserver();
              res(stop);
            })
            .catch((e: any) => {
              mover.stopImmediatly();
              rej(new Exception('Start driving failed', e));
            });
          // send event
          vehicle.tripStarted(
            userId,
            path.connections[path.connections.length - 1].to,
            price,
          );
        } else {
          // TODO resume driving if stopped
        }
        sendToUser.creditsLeft(amount, distanceLeft, millis);
      },
      creditsExausted(minimumAmount) {
        // TODO stop vehicle
        sendToUser.creditsExausted(minimumAmount);
      },
      closePaymentChannel(bundleHash) {
        sendToUser.closePaymentChannel(bundleHash);
      },
      cancelBoarding(reason) {
        sendToUser.cancelBoarding(reason);
      },
    };
  }

  private mockedBundle(price: number): Bundle {
    return [
      {
        address: 'A'.repeat(81),
        value: price,
        attachmentTimestamp: 0,
        attachmentTimestampLowerBound: 0,
        attachmentTimestampUpperBound: 0,
        branchTransaction: '',
        bundle: '',
        confirmed: true,
        currentIndex: 0,
        hash: '',
        lastIndex: 0,
        nonce: '',
        obsoleteTag: '',
        signatureMessageFragment: '',
        tag: '',
        timestamp: 0,
        trunkTransaction: '',
      },
    ];
  }

  private hash(value: Trytes) {
    const kerl = new Kerl();
    kerl.initialize();
    const input = trits(value);
    kerl.absorb(input, 0, input.length);
    const result = new Int8Array(243);
    kerl.squeeze(result, 0, input.length);
    return trytes(result);
  }

  private generateNonce(length = 81) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ9';
    const retVal = [];
    for (let i = 0, n = charset.length; i < length; ++i) {
      retVal[i] = charset.charAt(Math.floor(Math.random() * n));
    }
    const result = retVal.join('');
    return result;
  }
}
