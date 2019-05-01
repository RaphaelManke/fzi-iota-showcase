import { Trytes, Hash } from '@iota/core/typings/types';
import { Position } from './envInfo';
import { EventEmitter2, Listener, EventAndListener } from 'eventemitter2';

export class SafeEmitter {
  public static PUBLIC = 'public';
  public static INTERN = 'intern';

  constructor(
    private readonly events: EventEmitter2 = new EventEmitter2({
      wildcard: true,
    }),
  ) {}

  public emit(...event: Event) {
    this.events.emit([SafeEmitter.PUBLIC, event[0]], event[1]);
  }

  public emitIntern(type: string, ...data: any[]) {
    this.events.emit([SafeEmitter.INTERN, type], ...data);
  }

  public on<T extends Event, D extends T[1]>(
    type: T[0],
    listener: (...data: D[]) => void,
  ) {
    this.events.on([SafeEmitter.PUBLIC, type], listener);
  }

  public onIntern(type: string, listener: Listener) {
    this.events.on([SafeEmitter.INTERN, type], listener);
  }

  public offIntern(type: string, listener: Listener) {
    this.events.off(SafeEmitter.INTERN + '.' + type, listener);
  }

  public onAny(listener: EventAndListener) {
    this.events.onAny(listener);
  }
}

export type Event =
  | ['CheckIn', CheckIn]
  | ['Departed', Departed]
  | ['ReachedStop', ReachedStop]
  | ['Login', Login]
  | ['ReservationIssued', ReservationIssued]
  | ['ReservationExpired', ReservationExpired]
  | ['BoardingStarted', BoardingStarted]
  | ['BoardingCancelled', BoardingCancelled]
  | ['TripStarted', TripStarted]
  | ['TripFinished', TripFinished]
  | ['PosUpdated', PosUpdated]
  | ['Logout', Logout]
  | ['PaymentIssued', PaymentIssued]
  | ['TransactionIssued', TransactionIssued];

export interface ReachedStop {
  stopId: Trytes;
  vehicleId: Trytes;
  allowedDestinations: Trytes[];
}

export interface CheckIn {
  stopId: Trytes;
  vehicleId: Trytes;
}

export interface Departed {
  vehicleId: Trytes;
  stop: Trytes;
  destination: Trytes;
}

export abstract class TransactionIssued {
  constructor(
    public value: number,
    public address: Hash,
    public type: string,
  ) {}
}

export class CheckInTransaction extends TransactionIssued {
  constructor(public vehicle: Trytes, public stop: Trytes) {
    super(0, stop, 'checkIn');
  }
}

export class DepartedTransaction extends TransactionIssued {
  constructor(
    public address: Hash,
    public vehicle: Trytes,
    public stop: Trytes,
  ) {
    super(0, address, 'departed');
  }
}

export class ValueTransaction extends TransactionIssued {
  constructor(
    public address: Hash,
    public value: number,
    public from: Trytes,
    public to: Trytes,
  ) {
    super(value, address, 'value');
  }
}

export interface Login {
  id: Trytes;
  name: string;
  position: Position;
  balance: number;
  stop?: Hash;
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

export interface BoardingCancelled {
  userId: Trytes;
  vehicleId: Trytes;
  reason: string;
}

export interface TripStarted {
  userId: Trytes;
  vehicleId: Trytes;
  start: Trytes;
  destination: Trytes;
  price: number;
}

export interface TripFinished {
  userId: Trytes;
  vehicleId: Trytes;
  destination: Trytes;
}

export interface PosUpdated {
  id: Trytes;
  position: Position;
}

export interface PaymentIssued {
  from: Trytes;
  to: Trytes;
  amount: number;
}

export interface Logout {
  id: Trytes;
}
