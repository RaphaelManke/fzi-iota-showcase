import { Position } from './position';
import { Trytes } from '@iota/core/typings/types';
import { CheckInMessage } from 'fzi-iota-showcase-client';

export interface Observer {
  posUpdated(position: Position): void;

  checkedIn(stop: Trytes, checkIn: CheckInMessage): void;

  reachedStop(stop: Trytes): void;

  tripStarted(
    userId: Trytes,
    start: Trytes,
    destination: Trytes,
    price: number,
  ): void;

  transactionReceived(value: number, user: Trytes): void;

  transactionSent(value: number, user: Trytes): void;
}
