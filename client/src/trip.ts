import {Reservation} from './reservation';
import { Hash } from '@iota/core/typings/types';

export class Trip {
  constructor(public readonly paymentAddress: Hash, public readonly price: number,
              public readonly reservationRate: number, public readonly reservations: Reservation[] = [],
              public readonly departed: boolean = false) {
  }
}
