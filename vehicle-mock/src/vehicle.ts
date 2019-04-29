import { Trytes, Hash } from '@iota/core/typings/types';
import { Observer } from './observer';
import { Position } from './position';
import { TripState } from './tripState';
import { DriveStartingPolicy } from 'fzi-iota-showcase-client';
import { Boarder } from './boarder';

export class Vehicle {
  private trips: TripState[] = [];
  private mStop?: Trytes;
  private mPosition: Position;
  private observers = new Map<Partial<Observer>, Observer>();

  constructor(
    observer: Observer,
    public seed: Trytes,
    position: Position,
    stop: Trytes,
    public info: {
      type: string;
      speed: number;
      co2emission: number;
      maxReservations: number;
      driveStartingPolicy: DriveStartingPolicy;
    },
  ) {
    this.observers.set(observer, observer);
    this.mPosition = position;
    this.stop = stop;
  }

  get trip() {
    return this.trips[0];
  }

  public addTrip(trip: TripState) {
    this.trips.push(trip);
    Promise.resolve(
      this.observers.forEach((o) => o.checkedIn(trip.start, trip.checkInMessage)),
    );
  }

  public departed(stop: Trytes, destination: Trytes, address: Hash) {
    Promise.resolve(
      this.observers.forEach((o) => o.departed(stop, destination, address)),
    );
  }

  public tripStarted(userId: Trytes, destination: Trytes, price: number) {
    if (this.trip) {
      Promise.resolve(
        this.observers.forEach((o) =>
          o.tripStarted(userId, this.trip.start, destination, price),
        ),
      );
    }
  }

  public advanceTrip(toOverBoard: Boarder[]) {
    this.trips.splice(0, 1);
    if (this.trip) {
      this.trip.boarders = Array.from(toOverBoard);
    }
  }

  public transactionReceived(user: Trytes, value: number) {
    Promise.resolve(
      this.observers.forEach((o) => o.transactionReceived(value, user)),
    );
  }

  public transactionSent(user: Trytes, value: number) {
    Promise.resolve(
      this.observers.forEach((o) => o.transactionSent(value, user)),
    );
  }

  public addObserver(o: Partial<Observer>) {
    this.observers.set(o, {
      checkedIn: o.checkedIn || (() => {}),
      posUpdated: o.posUpdated || (() => {}),
      reachedStop: o.reachedStop || (() => {}),
      transactionReceived: o.transactionReceived || (() => {}),
      transactionSent: o.transactionSent || (() => {}),
      tripStarted: o.tripStarted || (() => {}),
      departed: o.departed || (() => {}),
    });
  }

  public removeObserver(o: Partial<Observer>) {
    this.observers.delete(o);
  }

  set stop(stop: Trytes | undefined) {
    this.mStop = stop;
    if (stop) {
      Promise.resolve(this.observers.forEach((o) => o.reachedStop(stop)));
    }
  }

  get stop() {
    return this.mStop;
  }

  set position(pos: Position) {
    this.mPosition = pos;
    this.mStop = undefined;
    Promise.resolve(this.observers.forEach((o) => o.posUpdated(pos)));
  }

  get position() {
    return this.mPosition;
  }
}
