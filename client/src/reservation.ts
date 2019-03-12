import { Hash, Trytes } from '@iota/core/typings/types';
import { fromTrytes } from './messages/converter';

export class Reservation {
  public static fromTrytes(input: Trytes): Reservation {
    return fromTrytes(input, ['expireDate', 'date']);
  }
  
  constructor(public readonly hashedNonce: Hash, public readonly expireDate: Date,
              public readonly repaymentAddress?: Hash) {}
}
