import { fromTrytes } from './converter';
import { Trytes, Hash } from '@iota/core/typings/types';

export abstract class ReservationMessage {
  public static fromTrytes(input: Trytes): ReservationMessage {
    return fromTrytes(input, ['expireDate', 'date']);
  }

  public static isExpired(reservation: ReservationMessage): boolean {
    return new Date() >= reservation.expireDate;
  }

  constructor(public readonly hashedNonce: Hash, public readonly expireDate: Date) {
  }
}
