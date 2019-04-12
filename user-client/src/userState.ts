import { log, createAttachToTangle } from 'fzi-iota-showcase-client';
import { API, composeAPI } from '@iota/core';
import { Hash } from '@iota/core/typings/types';

export class UserState {
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

  public async getAccountData() {
    const address = await this.iota.getNewAddress(this.seed);
    if (typeof address === 'string') {
      this.currentAddress = address;
    }
    const result = await this.iota.getAccountData(this.seed);
    return result;
  }
}
