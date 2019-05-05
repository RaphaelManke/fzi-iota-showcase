import { PaymentChannel, PaymentChannelState } from './boarding';
import { Hash, Trytes, Bundle } from '@iota/core/typings/types';
import { trits, trytes } from '@iota/converter';
import Kerl from '@iota/kerl';
import { generateAddress, API } from '@iota/core';
import { log } from '../logger';
import * as retry from 'bluebird-retry';

export class FlashMock implements PaymentChannel<any, any, any> {
  public state = PaymentChannelState.UNINITIALIZED;
  public rootAddress: Hash = '';
  public balances = new Map<Hash, number>();
  private seed?: Hash;
  private deposits?: number[];
  private settlementAddresses?: any[];
  private userIndex?: number;
  private settlementAddress?: Hash;

  private depth?: number;

  constructor(private readonly iota: API | undefined, private mwm = 9) {}

  public open(
    settlementAddress: Hash,
    userIndex: number,
    seed: Hash,
    signersCount: number,
    depth: number,
    security: number,
  ) {
    this.depth = depth;
    this.userIndex = userIndex;
    this.settlementAddress = settlementAddress;
    this.state = PaymentChannelState.CREATED;
  }

  public updateDeposit(deposits: number[]) {
    this.state = PaymentChannelState.READY;
    this.settlementAddresses!.forEach((address, index) =>
      this.balances.set(address, deposits[index]),
    );
  }

  public async prepareChannel(allDigests: any[], settlementAddresses: Hash[]) {
    this.state = PaymentChannelState.WAIT_FOR_DEPOSIT;
    this.settlementAddresses = settlementAddresses;
    this.seed = hash(
      settlementAddresses
        .map((a) => (a.length < 81 ? a + '9'.repeat(81 - a.length) : a))
        .reduce((acc, v) => acc + v, ''),
    );
    if (!this.iota) {
      this.rootAddress = generateAddress(this.seed, 0);
    } else {
      await retry(() =>
        this.iota!.getNewAddress(this.seed!).then((result) => {
          if (typeof result === 'string') {
            this.rootAddress = result;
          } else {
            this.rootAddress = result[0];
          }
        }),
      );
    }
  }

  public applyTransaction(signedBundles: any[]) {
    this.state = PaymentChannelState.READY;
    if (
      signedBundles &&
      Array.isArray(signedBundles) &&
      signedBundles[0] &&
      Array.isArray(signedBundles[0])
    ) {
      const txs = signedBundles[0];
      txs.forEach(({ value, address }: { value: number; address: Hash }) => {
        const old = this.balances.get(address) || 0;
        this.balances.set(address, old + value);
      });
    }
  }

  public async attachCurrentBundle(): Promise<Hash> {
    if (this.iota) {
      log.debug('Attaching closing transaction...');
      const transfers = Array.from(this.balances.entries())
        .filter(([, value]) => value > 0)
        .map(([address, value]) => ({ address, value }));
      try {
        const txs = await retry((b: Bundle) =>
          this.iota!.prepareTransfers(this.seed!, transfers).then((txTrytes) =>
            this.iota!.sendTrytes(txTrytes, 3, this.mwm),
          ),
        );
        return txs[0].hash;
      } catch (e) {
        log.debug('Seed of payment channel: %s', this.seed);
        log.debug('Balances on payment channel: %O', this.balances);
        throw e;
      }
    } else {
      return '';
    }
  }

  public async buildNewBranch(
    allDigests: any[],
    multisigAddress: any,
  ): Promise<any[]> {
    this.state = PaymentChannelState.READY;
    return [];
  }

  public async createTransaction(
    amount: number,
    address: Hash,
    onCreateNewBranch: (multisig: any, generate: number) => void,
  ): Promise<{ bundles: any[]; signedBundles: any[] }> {
    const txs = [
      { value: amount, address },
      { value: -amount, address: this.settlementAddress },
    ];
    return { bundles: [txs], signedBundles: [txs] };
  }

  public createCloseTransaction(): { bundles: any[]; signedBundles: any[] } {
    return { bundles: [], signedBundles: [] };
  }

  public signTransaction(bundles: any[], signedBundles: any[]): any[] {
    this.state = PaymentChannelState.SIGNED_TRANSACTION;
    return signedBundles;
  }

  public extractTransfers(
    bundles: any[],
    fromIndex: number,
  ): Array<{ value: number; address: Hash }> {
    return bundles
      .reduce((acc, v) => {
        acc.push(...v);
        return acc;
      }, [])
      .filter(({ value }: { value: number; address: Hash }) => value > 0);
  }

  public createDigests(amount = this.depth! + 1): any[] {
    this.state = PaymentChannelState.GENERATED_DIGESTS;
    return new Array(amount).fill('');
  }
}

function hash(value: Trytes) {
  const kerl = new Kerl();
  kerl.initialize();
  const input = trits(value);
  kerl.absorb(input, 0, input.length);
  const result = new Int8Array(Kerl.HASH_LENGTH);
  kerl.squeeze(result, 0, input.length);
  return trytes(result);
}
