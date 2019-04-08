import { Position } from './position';
import { Trytes } from '@iota/core/typings/types';

export interface Emitter {
  posUpdated(position: Position): void;

  checkedIn(stop: Trytes): void;
}
