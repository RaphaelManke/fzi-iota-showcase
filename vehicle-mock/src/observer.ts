import { Position } from './position';
import { Trytes } from '@iota/core/typings/types';
import { CheckInMessage } from 'fzi-iota-showcase-client';

export interface Observer {
  posUpdated(position: Position): void;

  checkedIn(stop: Trytes, checkIn: CheckInMessage): void;
}
