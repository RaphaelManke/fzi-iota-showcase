import { Vehicle } from './vehicle';
import { Mover } from './mover';
import { Route } from './router';
import { Trytes, Hash } from '@iota/core/typings/types';
import { API, composeAPI } from '@iota/core';
import { trits, trytes } from '@iota/converter';
import { createAttachToTangle, CheckInMessage } from 'fzi-iota-showcase-client';
import {
  createMasterChannel,
  addMetaInfo,
  publishCheckIn,
  getPaymentSeed,
} from 'fzi-iota-showcase-vehicle-client';
import { RAAM } from 'raam.client.js';
import Kerl from '@iota/kerl';

export class VehicleMock {
  private mover: Mover;
  private masterChannel?: RAAM;
  private currentAddress?: Hash;

  constructor(
    private vehicle: Vehicle,
    private nextStop: Trytes | undefined,
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
      await addMetaInfo(this.provider, this.vehicle.seed, this.vehicle.info);
    }
  }

  public async checkInAtCurrentStop() {
    if (this.nextStop) {
      if (!this.masterChannel) {
        await this.syncTangle();
      }
      if (!this.currentAddress) {
        await this.setupPayments();
      }

      const nonce = this.generateNonce();
      const message: CheckInMessage = {
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
        this.nextStop,
        message,
      );
      this.vehicle.currentTrip = {
        ...result,
        nonce,
      };
      this.vehicle.stop = this.nextStop;
      this.nextStop = undefined;
    }
  }

  public startTrip(
    route: Route,
    onStop?: (stop: Trytes) => void,
  ): Promise<Trytes> {
    return this.mover.startDriving(route, onStop);
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
