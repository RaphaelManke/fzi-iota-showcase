import { Trytes } from '@iota/core/typings/types';
import { Position, Trip } from './envInfo';
import { VehicleInfo as Info } from 'fzi-iota-showcase-client';

export interface VehicleInfo {
  info: Required<Info>;
  name: string;
  id: Trytes;
  position: Position;
  checkIn?: Trytes;
  trip?: Trip;
  balance: number;
}
