import { Hash } from '@iota/core/typings/types';

export interface StopWelcomeMessage {
  readonly tripChannelId: Int8Array;
  readonly checkInMessageRef: Hash;
}
