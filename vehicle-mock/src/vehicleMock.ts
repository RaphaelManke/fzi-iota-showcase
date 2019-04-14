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
import { getPathLength } from 'geolib';
import { MamWriter, MAM_MODE } from 'mam.ts';

export class VehicleMock {
  private mover: Mover;
  private masterChannel?: RAAM;
  private currentAddress?: Hash;
  private nextAddress?: Hash;

  constructor(
    private vehicle: Vehicle,
    private capacity: number,
    private price: number,
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
        price: this.price,
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
    setSentVehicleHandler: (handler: BoardingHandler) => void,
    onStop?: (stop: Trytes) => void,
  ): Promise<Trytes> {
    if (this.vehicle.trip) {
      if (this.vehicle.stop === path.connections[0].from) {
        const distance = getPathLength(
          path.waypoints.map((pos) => ({ latitude: pos.lat, longitude: pos.lng })),
        );
        let depositor: (value: number, address: Hash) => Promise<string>;
        let txReader: (bundleHash: Hash) => Promise<Bundle>;
        if (this.mockPayments) {
          depositor = async (value, address) => '';
          txReader = async (bundleHash) => this.mockedBundle();
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
        const b = new BoardingHandler(
          this.vehicle.trip.nonce,
          this.vehicle.trip.reservations,
          this.nextAddress!,
          this.price,
          this.vehicle.info.speed,
          () => ({ price: this.price * distance, distance }),
          depositor,
          txReader,
          new FlashMock(),
          sendToUser,
        );
        setSentVehicleHandler(b);
        this.vehicle.trip.state = State.DEPARTED;
        return await this.mover.startDriving(path, (stop) => {
          this.vehicle.stop = stop;
          if (onStop) {
            onStop(stop);
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

  private mockedBundle(): Bundle {
    return [
      {
        address: 'A'.repeat(81),
        value: this.price,
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
