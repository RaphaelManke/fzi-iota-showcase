import { Hash } from '@iota/core/typings/types';
import { ReservationMessage } from './messages/reservationMessage';

export class Trip {
  constructor(
    public readonly departsFrom: Hash,
    public readonly paymentAddress: Hash,
    public readonly price: number,
    public readonly reservationRate: number,
    public readonly hashedNonce: Hash,
    public readonly reservations: ReservationMessage[] | undefined,
    public readonly departed: boolean | undefined,
  ) {}
}
