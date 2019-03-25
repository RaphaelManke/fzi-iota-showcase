import { Trytes } from '@iota/core/typings/types';
import { Type } from './envInfo';

export interface VehicleInfo {
    info: {speed: number, co2emission: number, type: Type};
    name: string;
    id: Trytes;
    position: Position;
    checkIn: Trytes | undefined;
    trip: Trip | undefined;
    balance: number;
}

export interface Trip {
  userId: Trytes;
  destination: Trytes;
}
