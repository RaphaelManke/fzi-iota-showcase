import { Trytes } from '@iota/core/typings/types';
import { VehicleInfo } from './vehicleInfo';
import { Login } from './events';

export interface EnvironmentInfo {
  stops: Stop[];
  connections: Connection[];
  vehicles: VehicleInfo[];
  users: User[];
}

export interface Stop {
  id: Trytes;
  name: string;
  position: Position;
}

export interface Connection {
  type: string;
  from: Trytes;
  to: Trytes;
  path: Position[];
}

export interface Position {
  lng: number;
  lat: number;
}

export interface Trip {
  userId: Trytes;
  vehicleId: Trytes;
  destination: Trytes;
}

export interface User extends Login {
  loggedIn: boolean;
  trip?: Trip;
}
