import { Trytes } from '@iota/core/typings/types';
import { Position } from './envInfo';
import { EventEmitter2 } from 'eventemitter2';

export class SafeEmitter {
  constructor(private readonly events: EventEmitter2) {}

  public emit(...event: Event) {
    this.events.emit(event[0], event[1]);
  }
}

type Event = ['CheckIn', CheckIn] | ['Login', Login] | ['ReservationIssued', ReservationIssued]
  | ['ReservationExpired', ReservationExpired] | ['BoardingStarted', BoardingStarted]
  | ['TripStarted', TripStarted] | ['TripFinished', TripFinished] | ['PosUpdated', PosUpdated]
  | ['Logout', Logout] | ['TransactionIssued', Logout];

export interface CheckIn {
  stopId: Trytes;
  vehicleId: Trytes;
}

export interface Login {
  id: Trytes;
  name: string;
  position: Position;
  balance: number;
}

export interface ReservationIssued {
  userId: Trytes;
  vehicleId: Trytes;
}

export interface ReservationExpired {
  userId: Trytes;
  vehicleId: Trytes;
}

export interface BoardingStarted {
  userId: Trytes;
  vehicleId: Trytes;
  destination: Trytes;
}

export interface TripStarted {
  userId: Trytes;
  vehicleId: Trytes;
}

export interface TripFinished {
  userId: Trytes;
  vehicleId: Trytes;
}

export interface PosUpdated {
  id: Trytes;
  position: Position;
}

export interface TransactionIssued {
  from: Trytes;
  to: Trytes;
  amount: number;
}

export interface Logout {
  userId: Trytes;
}
