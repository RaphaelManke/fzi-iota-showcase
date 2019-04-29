import { Vehicle } from './vehicle';
import { Mover } from './mover';
import { Path } from './pathFinder';
import { Trytes, Hash } from '@iota/core/typings/types';
import { API, composeAPI, AccountData, generateAddress } from '@iota/core';
import { trits, trytes } from '@iota/converter';
import {
  createAttachToTangle,
  CheckInMessage,
  StopWelcomeMessage,
  Exception,
  VehicleInfo,
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
  publishCheckOutMessage,
} from 'fzi-iota-showcase-vehicle-client';
import { RAAM } from 'raam.client.js';
import Kerl from '@iota/kerl';
import { State } from './tripState';
import { getPathLength } from 'geolib';
import { MamWriter, MAM_MODE } from 'mam.ts';
import { Boarder } from './boarder';

export class VehicleMock {
  private mover: Mover;
  private masterChannel?: RAAM;
  private currentAddress?: Hash;
  private nextAddress?: Hash;
  private addressIndex = 0;

  constructor(
    public readonly vehicle: Vehicle,
    private capacity: number,
    private pricePerMeter: number,
    private reservationsRate: number,
    private provider: string,
    private iota: API = composeAPI({
      provider,
      attachToTangle: createAttachToTangle(provider),
    }),
    private depth = 3,
    private mwm = 14,
    private mockPayments = false,
    private mockMessages = false,
  ) {
    this.mover = new Mover(vehicle);
  }

  public get address() {
    return this.currentAddress;
  }

  public async setupPayments(): Promise<AccountData> {
    let result;
    const seed = trytes(getPaymentSeed(this.vehicle.seed));
    if (!this.mockPayments) {
      log.debug('Payment seed: %s', seed);
      const address = await this.iota.getNewAddress(seed);
      if (typeof address === 'string') {
        this.currentAddress = address;
      } else {
        this.currentAddress = address[0];
      }
      result = await this.iota.getAccountData(seed);
    } else {
      this.currentAddress = generateAddress(seed, this.addressIndex);
      result = {
        addresses: [''],
        balance: 3000,
        latestAddress: 'A',
        transactions: [],
        inputs: [],
        transfers: [],
      };
    }
    let addr;
    do {
      addr = generateAddress(seed, this.addressIndex++);
    } while (addr !== this.currentAddress);
    this.nextAddress = generateAddress(seed, this.addressIndex);
    return result;
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
      return this.checkIn(this.vehicle.stop);
    }
  }

  public async checkIn(
    stop: Trytes,
    index = this.mockMessages ? 1 : this.masterChannel!.cursor,
    validFrom?: Date,
    validUntil?: Date,
    allowedDestinations?: Trytes[],
  ) {
    if (!this.masterChannel) {
      await this.syncTangle();
    }
    if (!this.currentAddress) {
      await this.setupPayments();
    }

    const nonce = this.generateNonce();
    const vehicleInfo: VehicleInfo = { ...this.vehicle.info };
    if (allowedDestinations && allowedDestinations.length > 0) {
      vehicleInfo.allowedDestinations = allowedDestinations;
    }
    const checkInMessage: CheckInMessage = {
      hashedNonce: this.hash(nonce),
      vehicleId: this.mockMessages
        ? trits(this.vehicle.seed)
        : this.masterChannel!.channelRoot,
      vehicleInfo,
      tripChannelIndex: index,
      reservationRate: this.reservationsRate,
      price: this.pricePerMeter,
      paymentAddress: this.currentAddress!,
    };
    if (validFrom) {
      checkInMessage.validFrom = validFrom;
    }
    if (validUntil) {
      checkInMessage.validUntil = validUntil;
    }
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
        stop,
        checkInMessage,
      );
    } else {
      result = {
        reservationChannel: new MamWriter('', 'Z'.repeat(81), MAM_MODE.PUBLIC),
        tripChannel: await RAAM.fromSeed('9', { amount: 2 }),
        welcomeMessage: {
          checkInMessageRef: '',
          tripChannelId: new Int8Array(0),
        },
      };
    }
    this.vehicle.addTrip({
      ...result,
      nonce,
      state: State.CHECKED_IN,
      checkInMessage,
      settlementAddress: this.nextAddress!,
      start: stop,
      reservations: [],
      boarders: [],
    });
    this.advanceAddresses();
    return checkInMessage;
  }

  public startBoarding(
    path: Path,
    sendToUser: Sender,
    userId: Trytes,
    setSentVehicleHandler: (handler: BoardingHandler) => void,
    onTripFinished: (stop: Trytes) => void,
  ): Promise<void> {
    if (this.vehicle.trip) {
      if (this.vehicle.stop === path.connections[0].from) {
        // TODO adjust if reservations are implemented
        if (
          this.vehicle.trip.boarders.length < this.vehicle.info.maxReservations
        ) {
          if (
            this.isDestinationAllowed(
              path.connections[path.connections.length - 1].to,
            )
          ) {
            if (this.vehicle.trip.boarders.find((b) => b.userId === userId)) {
              return Promise.reject(
                new Error('User with this id already boarded.'),
              );
            }
            const distance = getPathLength(
              path.waypoints.map((pos) => ({
                latitude: pos.lat,
                longitude: pos.lng,
              })),
            );

            const price = this.pricePerMeter * distance;

            // use real or mocked payment functions
            let depositor: (value: number, address: Hash) => Promise<string>;
            if (this.mockPayments) {
              depositor = async (value, address) => '';
            } else {
              depositor = async (value, address) => {
                const txTrytes = await this.iota.prepareTransfers(
                  getPaymentSeed(this.vehicle.seed),
                  [{ value, address }],
                );
                const txs = await this.iota.sendTrytes(
                  txTrytes,
                  this.depth,
                  this.mwm,
                );
                return txs[0].hash;
              };
            }

            const boarder = new Boarder(
              this.vehicle,
              userId,
              this.vehicle.trip.settlementAddress,
              path,
              this.pricePerMeter,
              onTripFinished,
            );
            this.vehicle.trip.boarders.push(boarder);
            return boarder
              .startBoarding(
                sendToUser,
                depositor,
                this.mockPayments,
                this.iota,
                setSentVehicleHandler,
              )
              .then(() => {
                if (
                  this.vehicle.info.driveStartingPolicy === 'AFTER_BOARDING'
                ) {
                  this.startDriving();
                }
              });
          } else {
            return Promise.reject(
              new Error('Vehicle does not allow this destination.'),
            );
          }
        } else {
          return Promise.reject(
            new Error('Vehicle is booked out. Too many passengers on board.'),
          );
        }
      } else {
        return Promise.reject(
          new Error('Vehicle is not at the start of the given path'),
        );
      }
    } else {
      return Promise.reject(new Error('Vehicle is not checked in.'));
    }
  }

  public stopTripAtNextStop(userId: Trytes) {
    const stop = this.mover.stopDrivingAtNextStop();
    if (stop && this.vehicle.trip) {
      this.vehicle.trip.boarders
        .filter((b) => b.userId === userId)
        .forEach((b) => b.updateDestination(stop));
    }
    return stop;
  }

  public emitTransactionSent(to: Trytes, value: number) {
    this.vehicle.transactionSent(to, value);
  }

  public startDriving(onStop?: (stop: Trytes) => void) {
    return new Promise<Trytes>((res, rej) => {
      if (this.vehicle.trip) {
        const checkOut = this.mockMessages
          ? Promise.resolve('')
          : publishCheckOutMessage(this.vehicle.trip.tripChannel);
        checkOut
          .then((address) => {
            if (this.vehicle.trip && this.vehicle.trip.path) {
              this.notifyVehicleDeparted(
                this.vehicle.trip.start,
                this.vehicle.trip.destination!,
                address,
              );
              return this.mover.startDriving(this.vehicle.trip.path, (stop) => {
                this.vehicle.stop = stop;
                if (onStop) {
                  onStop(stop);
                }
              });
            } else {
              return Promise.reject(new Error('Destination was not set.'));
            }
          })
          .then((stop) => {
            this.vehicle.trip!.state = State.FINISHED;
            const toOverBoard: Boarder[] = [];
            this.vehicle.trip!.boarders.forEach((b) => {
              if (b.destination === stop) {
                b.tripFinished(stop);
              } else {
                toOverBoard.push(b);
              }
            });
            this.vehicle.advanceTrip(toOverBoard);
            res(stop);
            // TODO switch this to AUTO_CHECK_IN
            if (this.vehicle.info.driveStartingPolicy !== 'MANUAL') {
              this.checkInAtCurrentStop();
            }
          })
          .catch((e: any) => {
            this.mover.stopImmediatly();
            rej(new Exception('Start driving failed', e));
          });
      } else {
        rej(new Error('Destination was not set.'));
      }
    });
  }

  private advanceAddresses() {
    this.addressIndex++;
    this.currentAddress = this.nextAddress;
    this.nextAddress = generateAddress(
      trytes(getPaymentSeed(this.vehicle.seed)),
      this.addressIndex,
    );
  }

  private isDestinationAllowed(dest: Trytes) {
    const vehicleInfo = this.vehicle.trip.checkInMessage.vehicleInfo;
    return (
      !vehicleInfo ||
      !vehicleInfo.allowedDestinations ||
      vehicleInfo.allowedDestinations.length === 0 ||
      vehicleInfo.allowedDestinations.find((s: Trytes) => s === dest)
    );
  }

  private notifyVehicleDeparted(
    stop: Trytes,
    destination: Trytes,
    address: Hash,
  ): Promise<void> {
    this.vehicle.departed(stop, destination, address);
    if (this.vehicle.trip) {
      this.vehicle.trip.state = State.DEPARTED;
      this.vehicle.trip.boarders
        .filter((b) => b.start === this.vehicle.trip!.start)
        .forEach((b) => b.onStartDriving());
      return Promise.resolve();
    } else {
      return Promise.reject(new Error('Trip was not set'));
    }
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
