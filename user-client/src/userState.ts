import {
  log,
  createAttachToTangle,
  CheckInMessage,
  FlashMock,
  Exception,
} from 'fzi-iota-showcase-client';
import { API, composeAPI, generateAddress } from '@iota/core';
import { Hash, Trytes, Bundle, Transaction } from '@iota/core/typings/types';
import { TripHandler, Sender } from './tripHandler';
import * as retry from 'bluebird-retry';

export class UserState {
  public static PAYMENT_EACH_MILLIS = 5000;
  private currentAddress?: Hash;
  private nextAddress?: Hash;
  private iota: API;
  private depth: number;
  private mwm: number;
  private mockPayments: boolean;
  private addressIndex = 0;

  constructor(
    private seed: Hash,
    private id: Trytes,
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
    const paymentAmount = duration / UserState.PAYMENT_EACH_MILLIS;
    log.debug(
      'User %s will use %s payments for trip',
      this.id,
      Math.ceil(paymentAmount),
    );
    const nonce = generateNonce(); // TODO when reserving nonce must be generated before trip

    const flash = new FlashMock(
      this.mockPayments ? undefined : this.iota,
      this.mwm,
    );
    // use real or mocked payment functions
    let depositor: (value: number, address: Hash) => Promise<string>;
    let txReader: (bundleHash: Hash) => Promise<Bundle>;
    if (this.mockPayments) {
      depositor = async (value, address) => '';
      txReader = async (bundleHash) =>
        this.mockedBundle(maxPrice, flash.rootAddress);
    } else {
      depositor = async (value, address) => {
        const txs = await retry((b: Bundle) =>
          this.iota
            .prepareTransfers(this.seed, [{ value, address }])
            .then((txTrytes) =>
              this.iota.sendTrytes(txTrytes, this.depth, this.mwm),
            ),
        );
        return txs[0].hash;
      };
      txReader = async (tailTransactonHash) =>
        await retry((b: Bundle) => this.iota.getBundle(tailTransactonHash));
    }

    const result = new TripHandler(
      destination,
      checkInMessage,
      maxPrice,
      nonce,
      this.nextAddress!,
      paymentAmount,
      depositor,
      txReader,
      flash,
      sender,
    );
    this.advanceAddresses();
    return result;
  }

  public async getBalance(): Promise<number> {
    let result = 0;
    if (!this.mockPayments) {
      try {
        let fetched = 0;
        const unused = await this.iota.getNewAddress(this.seed);
        do {
          this.currentAddress = generateAddress(this.seed, this.addressIndex++);
          this.nextAddress = generateAddress(this.seed, this.addressIndex);

          const b = await this.iota.getBalances(
            [this.currentAddress, this.nextAddress],
            100,
          );
          fetched = b.balances.reduce((acc, v) => acc + v);
          result += b.balances[0];
        } while (this.currentAddress !== unused || fetched > 0);
      } catch (e) {
        return Promise.reject(
          new Exception('Get account data of user failed.', e),
        );
      }
    } else {
      this.currentAddress = generateAddress(this.seed, this.addressIndex++);
      this.nextAddress = generateAddress(this.seed, this.addressIndex);
    }
    return result;
  }

  private async advanceAddresses() {
    this.addressIndex++;
    this.currentAddress = this.nextAddress;
    this.nextAddress = generateAddress(this.seed, this.addressIndex);
  }

  private mockedBundle(price: number, address: Hash): Bundle {
    return [
      {
        address,
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
