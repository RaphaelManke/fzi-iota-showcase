import { PaymentChannel, PaymentChannelState } from './boarding';
import { Hash } from '@iota/core/typings/types';

export class FlashMock implements PaymentChannel<any, any, any> {
  public state = PaymentChannelState.UNINITIALIZED;
  public rootAddress = 'A'.repeat(81);

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
    this.state = PaymentChannelState.CREATED;
  }

  public updateDeposit(deposits: number[]) {
    this.state = PaymentChannelState.READY;
  }

  public prepareChannel(allDigests: any[], settlementAddresses: Hash[]) {
    this.state = PaymentChannelState.WAIT_FOR_DEPOSIT;
  }

  public applyTransaction(signedBundles: any[]) {
    this.state = PaymentChannelState.READY;
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
