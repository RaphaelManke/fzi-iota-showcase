import { Hash } from '@iota/core/typings/types';

export interface StopWelcomeMessage {
  readonly paymentAddress: Hash;
  readonly price: number;
  readonly reservationRate: number;
}
