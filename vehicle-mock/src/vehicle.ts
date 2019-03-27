import { Trytes } from '@iota/core/typings/types';
import { Emitter } from './emitter';
import { Position } from './position';

export class Vehicle {
  public stop: Trytes | undefined;
  private mPosition: Position;

  constructor(private emitter: Emitter, public seed: Trytes, stop: {id: Trytes, position: Position},
              public info: {type: 'car' | 'bike' | 'tram', speed: number, co2emission: number}) {
    this.mPosition = stop.position;
    this.stop = stop.id;
  }

  set position(pos: Position) {
    this.mPosition = pos;
    this.stop = undefined;
    this.emitter.posUpdated(pos);
  }

  get position() {
    return this.mPosition;
  }
}
