import { Position } from './position';

export interface Emitter {
  posUpdated(position: Position): void;
}
