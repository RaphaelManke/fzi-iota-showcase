import { PaymentChannel, PaymentChannelState } from './boarding';
import { Hash } from '@iota/core/typings/types';

export class FlashMock implements PaymentChannel<any, any, any> {
  public state = PaymentChannelState.CREATED;
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
  }

  public updateDeposit(deposits: number[]) {}

  public prepareChannel(allDigests: any[], settlementAddresses: Hash[]) {}

  public applyTransaction(signedBundles: any[]) {}

  public async attachCurrentBundle(): Promise<Hash> {
    return '';
  }

  public async buildNewBranch(
    allDigests: any[],
    multisigAddress: any,
  ): Promise<any[]> {
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
    return new Array(amount).fill('');
  }
}

(() => {
  // const txs = [{ amount: 12344, address: 'A' }];
  // const bundles = [txs];
  // console.log(new FlashMock().extractTransfers(bundles, 1));
})();
