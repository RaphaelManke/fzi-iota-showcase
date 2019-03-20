import {Trip} from './trip';

export class Vehicle {
  constructor(public readonly vehicleId: Int8Array, public readonly info: VehicleInfo,
              public readonly trips: Trip[] = []) {
  }
}

export interface VehicleInfo {
  type?: string;
  speed?: number;
  co2emission?: number;
  maxReservations?: number;
  [args: string]: any;
}
