import { Trytes } from '@iota/core/typings/types';
import { Position } from './envInfo';

export interface CheckIn {
  stopId: Trytes;
  vehicleId: Trytes;
}

export interface Login {
  id: Trytes;
  name: string;
  position: Position;
  balance: number;
}

export interface ReservationIssued {
  userId: Trytes;
  vehicleId: Trytes;
}

export interface ReservationExpired {
  userId: Trytes;
  vehicleId: Trytes;
}

export interface BoardingStarted {
  userId: Trytes;
  vehicleId: Trytes;
  destination: Trytes;
}

export interface TripStarted {
  userId: Trytes;
  vehicleId: Trytes;
}

export interface TripFinished {
  userId: Trytes;
  vehicleId: Trytes;
}

export interface PosUpdated {
  id: Trytes;
  position: Position;
}

export interface TransactionIssued {
  from: Trytes;
  to: Trytes;
  amount: number;
}

export interface Logout {
  userId: Trytes;
}
