import {
  log,
  createAttachToTangle,
  CheckInMessage,
  FlashMock,
} from 'fzi-iota-showcase-client';
import { API, composeAPI, AccountData } from '@iota/core';
import { Hash, Trytes, Bundle } from '@iota/core/typings/types';
import { TripHandler, Sender } from './tripHandler';

export class UserState {
  public static PAYMENT_EACH_MILLIS = 5000;
  private currentAddress?: Hash;
  private nextAddress?: Hash;
  private iota: API;
  private depth: number;
  private mwm: number;
  private mockPayments: boolean;

  constructor(
    private seed: Hash,
    {
      mockPayments = false,
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
      mockPayments: boolean;
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
    this.mockPayments = mockPayments;
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

    let depositor: (value: number, address: Hash) => Promise<string>;
    let txReader: (bundleHash: Hash) => Promise<Bundle>;
    if (this.mockPayments) {
      depositor = async (value, address) => '';
      txReader = async (bundleHash) => this.mockedBundle(maxPrice);
    } else {
      depositor = async (value, address) => {
        const txTrytes = await this.iota.prepareTransfers(this.seed, [
          { value, address },
        ]);
        const txs = await this.iota.sendTrytes(txTrytes, this.depth, this.mwm);
        return txs[0].bundle;
      };
      txReader = async (bundleHash) => await this.iota.getBundle(bundleHash);
    }

    return new TripHandler(
      destination,
      checkInMessage,
      maxPrice,
      nonce,
      this.nextAddress!,
      paymentAmount,
      depositor,
      txReader,
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
