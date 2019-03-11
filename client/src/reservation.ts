import { Hash } from '@iota/core/typings/types';

export class Reservation {
  constructor(public readonly hashedNonce: string, public readonly expireDate: Date,
              public readonly repaymentAddress?: Hash) {}
}
