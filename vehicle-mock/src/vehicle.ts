import { Trytes } from '@iota/core/typings/types';
import { Emitter } from './emitter';
import { Position } from './position';
import { TripState } from './tripState';

export class Vehicle {
  public currentTrip: TripState | undefined;
  private mStop: Trytes | undefined;
  private mPosition: Position;

  constructor(
    private emitter: Emitter,
    public seed: Trytes,
    position: Position,
    public info: { type: string; speed: number; co2emission: number },
  ) {
    this.mPosition = position;
  }

  set stop(stop: Trytes | undefined) {
    this.mStop = stop;
    if (stop) {
      this.emitter.checkedIn(stop);
    }
  }

  get stop() {
    return this.mStop;
  }

  set position(pos: Position) {
    this.mPosition = pos;
    this.mStop = undefined;
    this.emitter.posUpdated(pos);
  }

  get position() {
    return this.mPosition;
  }
}
