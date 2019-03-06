import { Hash } from '@iota/core/typings/types';

export default interface ReservationMessage {
  readonly expireDate: Date;
  readonly hashedNonce: string;
  readonly repaymentAddress?: Hash;
}
