import { Type } from './envInfo';
import * as fs from 'fs';
import { Hash, Trytes } from '@iota/core/typings/types';

export function readVehicles(path: string): VehicleDescription[] {
  return JSON.parse(fs.readFileSync(path).toString());
}

export interface VehicleDescription {
  name: string;
  type: string;
  speed: number;
  co2emission: number;
  seed: Hash;
  price: number;
  reservationRate: number;
  channelCapacity: number;
  stop: Trytes;
  maxReservations?: number;
}
