import { Trytes } from '@iota/core/typings/types';
import { Type, Position } from './envInfo';

export interface VehicleInfo {
  info: {speed: number, co2emission: number, type: Type};
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
