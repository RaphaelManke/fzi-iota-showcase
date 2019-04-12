import { PaymentChannel, PaymentChannelState } from './boarding';
import { Hash } from '@iota/core/typings/types';

export class FlashMock implements PaymentChannel<any, any, any> {
  public state = PaymentChannelState.CREATED;
  public rootAddress = '';

  public open(
    settlementAddress: Hash,
    userIndex: number,
    seed: Hash,
    signersCount: number,
    depth: number,
    security: number,
  ) {}

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
    return { bundles: [], signedBundles: [] };
  }

  public createCloseTransaction(): { bundles: any[]; signedBundles: any[] } {
    return { bundles: [], signedBundles: [] };
  }

  public signTransaction(bundles: any[], signedBundles: any[]): any[] {
    return [];
  }

  public extractTransfers(
    bundles: any[],
    fromIndex: number,
  ): Array<{ value: number; address: Hash }> {
    return [];
  }

  public createDigests(amount?: number): any[] {
    return [];
  }
}
