import { Hash, Trytes } from '@iota/core/typings/types';
import { fromTrytes } from './converter';

export class StopWelcomeMessage {
  public static fromTrytes(input: Trytes): StopWelcomeMessage {
    return fromTrytes(input, ['tripChannelId', 'trits']);
  }
  
  constructor(public readonly tripChannelId: Int8Array, public readonly checkInMessageRef: Hash) {}
}
