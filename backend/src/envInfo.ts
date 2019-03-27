import { Trytes } from '@iota/core/typings/types';
import { VehicleInfo } from './vehicleInfo';

export interface EnvironmentInfo {
  stops: Stop[];
  connections: Connection[];
  vehicles: VehicleInfo[];
  users: User[];
}

export interface Stop extends Position {
  id: Trytes;
  name: string;
}

export interface Connection {
  type: Type;
  from: Trytes;
  to: Trytes;
  path: Position[];
}

export interface Position {
  lng: number;
  lat: number;
}

export type Type = 'car' | 'bike' | 'tram';

export interface User {
  id: Trytes;
  name: string;
  position: Position;
  balance: number;
}

// login(id) -> wallet, position

// getStops()

// getConnection()

// getCheckIn()

// reserveVehicle()
