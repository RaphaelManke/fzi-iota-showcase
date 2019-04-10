import { Trytes } from '@iota/core/typings/types';

export interface RouteInfo {
  start: Trytes; // stop
  destination: Trytes; // stop
  sections: Section[];
}

export interface Section {
  vehicle: {
    id: Trytes;
    type: string;
  };
  from: Trytes; // stop
  to: Trytes; // stop
  intermediateStops: Trytes[];
  departure: Date; // timestamp
  arrival: Date; // timestamp
  price: number;
  distance: number;
}
