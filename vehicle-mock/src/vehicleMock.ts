import { Vehicle } from './vehicle';
import { Mover } from './mover';
import { Path } from './pathFinder';
import { Trytes, Hash } from '@iota/core/typings/types';
import { API, composeAPI } from '@iota/core';
import { trits, trytes } from '@iota/converter';
import {
  createAttachToTangle,
  CheckInMessage,
  FlashMock,
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
  ) {
    this.mover = new Mover(vehicle);
  }

  public async setupPayments() {
    const seed = trytes(getPaymentSeed(this.vehicle.seed));
    const result = await this.iota.getNewAddress(seed);
    if (typeof result === 'string') {
      this.currentAddress = result;
    } else {
      this.currentAddress = result[0];
      this.nextAddress = result[1];
    }
    return await this.iota.getAccountData(seed);
  }

  public async syncTangle() {
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
        vehicleId: this.masterChannel!.channelRoot,
        vehicleInfo: this.vehicle.info,
        tripChannelIndex: this.masterChannel!.cursor,
        reservationRate: this.reservationsRate,
        price: this.price,
        paymentAddress: this.currentAddress!,
      };
      const result = await publishCheckIn(
        this.provider,
        this.vehicle.seed,
        this.masterChannel!,
        this.vehicle.stop,
        checkInMessage,
      );
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
        const b = new BoardingHandler(
          this.vehicle.trip.nonce,
          this.vehicle.trip.reservations,
          this.nextAddress!,
          this.price,
          this.vehicle.info.speed,
          () => ({ price: this.price * distance, distance }),
          async (value, address) => {
            return ''; // TODO
          },
          async (bundleHash) => {
            return (await this.iota.getBundle(bundleHash))[0]; // TODO
          },
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
