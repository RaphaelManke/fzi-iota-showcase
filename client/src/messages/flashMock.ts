import { PaymentChannel, PaymentChannelState } from './boarding';
import { Hash, Trytes } from '@iota/core/typings/types';
import { trits, trytes } from '@iota/converter';
import Kerl from '@iota/kerl';
import { generateAddress } from '@iota/core';

export class FlashMock implements PaymentChannel<any, any, any> {
  public state = PaymentChannelState.UNINITIALIZED;
  public rootAddress: Hash = '';
  private seed?: Hash;
  private deposits?: number[];
  private settlementAddresses?: any[];
  private userIndex?: number;
  private settlementAddress?: Hash;
  private balances = new Map<Hash, number>();

  private depth?: number;

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
    this.settlementAddresses!.forEach((address, index) => this.balances.set(address, deposits[index]));
  }

  public prepareChannel(allDigests: any[], settlementAddresses: Hash[]) {
    this.state = PaymentChannelState.WAIT_FOR_DEPOSIT;
    this.settlementAddresses = settlementAddresses;
    this.seed = hash(settlementAddresses
      .map((a) => a.length < 81 ? a + '9'.repeat(81 - a.length) : a)
      .reduce((acc, v) => acc + v, ''));
    this.rootAddress = generateAddress(this.seed, 0);
  }

  public applyTransaction(signedBundles: any[]) {
    this.state = PaymentChannelState.READY;
    const tx = signedBundles[0][0];
    this.balances.set(tx.address, this.balances.get(tx.address) + tx.value);
    const myAddress = this.settlementAddresses![this.userIndex!];
    this.balances.set(myAddress, this.balances.get(myAddress)! - tx.value);
  }

  public async attachCurrentBundle(): Promise<Hash> {
    return '';
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
    const txs = [{ value: amount, address }];
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
    return bundles.reduce((acc, v) => {
      acc.push(...v);
      return acc;
    }, []);
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
