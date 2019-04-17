import { Trytes } from '@iota/core/typings/types';
import { Observer } from './observer';
import { Position } from './position';
import { TripState } from './tripState';
import { DriveStartingPolicy } from 'fzi-iota-showcase-client';

export class Vehicle {
  private currentTrip?: TripState;
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
    return this.currentTrip;
  }

  set trip(trip: TripState | undefined) {
    this.currentTrip = trip;
    if (trip) {
      Promise.resolve(
        this.observers.forEach((o) =>
          o.checkedIn(trip.start, trip.checkInMessage),
        ),
      );
    }
  }

  public tripStarted(userId: Trytes, destination: Trytes, price: number) {
    if (this.currentTrip) {
      Promise.resolve(
        this.observers.forEach((o) =>
          o.tripStarted(userId, this.currentTrip!.start, destination, price),
        ),
      );
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
