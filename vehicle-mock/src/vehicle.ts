import { Trytes } from '@iota/core/typings/types';
import { Emitter } from './emitter';
import { Position } from './position';
import { Router } from './router';

export class Vehicle {
  public stop: Trytes | undefined;
  private mPosition: Position;

  constructor(private emitter: Emitter, private router: Router, public seed: Trytes, stop: Position & {id: Trytes},
              public info: {type: 'car' | 'bike' | 'tram', speed: number, co2emission: number}) {
    this.mPosition = {...stop};
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

  public startDriving(dest: Trytes) {
    if (this.stop) {
      const route = this.router.getPath(this.stop, dest, this.info.type);

    } else {
      throw new Error('Vehicle isn\'t at a stop');
    }
  }
}
