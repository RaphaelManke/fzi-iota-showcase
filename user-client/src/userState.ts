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
  private currentAddress?: Hash;
  private nextAddress?: Hash;
  private iota: API;
  private depth: number;
  private mwm: number;

  constructor(
    private seed: Hash,
    {
      depth = 3,
      mwm = 14,
      provider,
      iota = provider
        ? composeAPI({
            provider,
            attachToTangle: createAttachToTangle(),
          })
        : undefined,
    }: {
      provider?: string;
      iota?: API | undefined;
      depth?: number;
      mwm?: number;
    },
  ) {
    if (!iota) {
      throw new Error('IOTA client must be set');
    }
    this.iota = iota;
    this.depth = depth;
    this.mwm = mwm;
  }

  public createTripHandler(
    destination: Trytes,
    checkInMessage: CheckInMessage,
    maxPrice: number,
    duration: number,
    sender: Sender,
  ): TripHandler {
    const paymentAmount = UserState.PAYMENT_EACH_MILLIS / duration;
    const nonce = generateNonce(); // TODO when reserving nonce must be generated before trip
    return new TripHandler(
      destination,
      checkInMessage,
      maxPrice,
      nonce,
      this.nextAddress!,
      paymentAmount,
      async (value, address) => {
        const trytes = await this.iota.prepareTransfers(this.seed, [
          { value, address },
        ]);
        const txs = await this.iota.sendTrytes(trytes, this.depth, this.mwm);
        return txs[0].bundle;
      },
      async (bundleHash) => await this.iota.getBundle(bundleHash),
      new FlashMock(),
      sender,
    );
  }

  public async getAccountData(): Promise<AccountData> {
    const address = await this.iota.getNewAddress(this.seed, { total: 2 });
    if (typeof address === 'string') {
      this.currentAddress = address;
    } else {
      this.currentAddress = address[0];
      this.nextAddress = address[1];
    }
    const result = await this.iota.getAccountData(this.seed);
    return result;
  }
}

function generateNonce(length = 81) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ9';
  const retVal = [];
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal[i] = charset.charAt(Math.floor(Math.random() * n));
  }
  const result = retVal.join('');
  return result;
}
