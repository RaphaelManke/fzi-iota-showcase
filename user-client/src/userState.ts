import {
  log,
  createAttachToTangle,
  CheckInMessage,
  FlashMock,
} from 'fzi-iota-showcase-client';
import { API, composeAPI, AccountData } from '@iota/core';
import { Hash, Trytes } from '@iota/core/typings/types';
import { TripHandler, Sender } from './tripHandler';

export class UserState {
  public static PAYMENT_EACH_MILLIS = 5000;
  private currentAddress: Hash | undefined;
  private iota: API;

  constructor(
    private seed: Hash,
    {
      provider,
      iota = provider
        ? composeAPI({
            provider,
            attachToTangle: createAttachToTangle(),
          })
        : undefined,
    }: { provider?: string; iota?: API | undefined },
  ) {
    if (!iota) {
      throw new Error('IOTA client must be set');
    }
    this.iota = iota;
  }

  public createTripHandler(
    destination: Trytes,
    checkInMessage: CheckInMessage,
    maxPrice: number,
    duration: number,
    sender: Sender,
  ): TripHandler {
    const paymentAmount = UserState.PAYMENT_EACH_MILLIS / duration;
    return new TripHandler(
      destination,
      checkInMessage,
      maxPrice,
      '', // TODO
      'SETTLEMENTADDRESS', // TODO
      paymentAmount,
      async (value, address) => {
        return ''; // TODO
      },
      async (bundleHash) => {
        return (await this.iota.getBundle(bundleHash))[0]; // TODO
      },
      new FlashMock(),
      sender,
    );
  }

  public async getAccountData(): Promise<AccountData> {
    const address = await this.iota.getNewAddress(this.seed);
    if (typeof address === 'string') {
      this.currentAddress = address;
    }
    const result = await this.iota.getAccountData(this.seed);
    return result;
  }
}
