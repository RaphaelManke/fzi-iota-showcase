import { Trytes } from '@iota/core/typings/types';
import { Type } from './envInfo';

export interface RouteInfo {
  start: Trytes; // stop
  destination: Trytes; // stop
  sections: Section[];
}

export interface Section {
  vehicle: {
    id: Trytes;
    type: Type;
  };
  from: Trytes; // stop
  to: Trytes; // stop
  departure: Date; // timestamp
  arrival: Date; // timestamp
  price: number;
  distance: number;
}
