import { Trytes } from '@iota/core/typings/types';
import { Position, Trip } from './envInfo';
import { VehicleInfo as Info, CheckInMessage } from 'fzi-iota-showcase-client';

export interface VehicleInfo {
  info: Required<Info>;
  name: string;
  id: Trytes;
  position: Position;
  stop?: Trytes;
  checkIns: Array<{ stop: Trytes; message: CheckInMessage }>;
  trips: Trip[];
  balance: number;
}
