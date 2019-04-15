import { Trytes } from '@iota/core/typings/types';
import { Observer } from './observer';
import { Position } from './position';
import { TripState } from './tripState';

export class Vehicle {
  private currentTrip: TripState | undefined;
  private mStop: Trytes | undefined;
  private mPosition: Position;
  private observers: Set<Observer> = new Set<Observer>();

  constructor(
    observer: Observer,
    public seed: Trytes,
    position: Position,
    stop: Trytes,
    public info: { type: string; speed: number; co2emission: number },
  ) {
    this.observers.add(observer);
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
        this.observers.forEach((o) => o.checkedIn(trip.stop, trip.checkInMessage)),
      );
    }
  }

  public tripStarted(userId: Trytes, destination: Trytes, price: number) {
    if (this.currentTrip) {
      Promise.resolve(
        this.observers.forEach((o) =>
          o.tripStarted(userId, this.currentTrip!.stop, destination, price),
        ),
      );
    }
  }

  public transactionReceived(user: Trytes, value: number) {
    Promise.resolve(
      this.observers.forEach((o) => o.transactionReceived(value, user)),
    );
  }

  public addObserver(o: Observer) {
    this.observers.add(o);
  }

  public removeObserver(o: Observer) {
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
