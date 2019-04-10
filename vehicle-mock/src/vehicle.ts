import { Trytes } from '@iota/core/typings/types';
import { Observer } from './observer';
import { Position } from './position';
import { TripState } from './tripState';

export class Vehicle {
  private currentTrip: TripState | undefined;
  private mStop: Trytes | undefined;
  private mPosition: Position;

  constructor(
    public observer: Observer,
    public seed: Trytes,
    position: Position,
    stop: Trytes,
    public info: { type: string; speed: number; co2emission: number },
  ) {
    this.mPosition = position;
    this.stop = stop;
  }

  set trip(trip: TripState | undefined) {
    this.currentTrip = trip;
    if (trip) {
      this.observer.checkedIn(trip.stop, trip.checkInMessage);
    }
  }

  get trip() {
    return this.currentTrip;
  }

  set stop(stop: Trytes | undefined) {
    this.mStop = stop;
    if (stop) {
      this.observer.reachedStop(stop);
    }
  }

  get stop() {
    return this.mStop;
  }

  set position(pos: Position) {
    this.mPosition = pos;
    this.mStop = undefined;
    this.observer.posUpdated(pos);
  }

  get position() {
    return this.mPosition;
  }
}
