import { Trytes } from '@iota/core/typings/types';
import { Type, Position } from './envInfo';
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

export interface Trip {
  userId: Trytes;
  destination: Trytes;
}
