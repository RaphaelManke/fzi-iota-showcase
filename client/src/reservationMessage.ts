import { Hash } from '@iota/core/typings/types';

export interface ReservationMessage {
  readonly expireDate: Date;
  readonly hashedNonce: string;
  readonly repaymentAddress?: Hash;
}
