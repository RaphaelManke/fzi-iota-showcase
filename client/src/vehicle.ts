import Trip from './trip';

export default class Vehicle {
  constructor(public readonly info: VehicleInfo, public readonly trips: Trip[]) {
  }
}

export interface VehicleInfo {
  type?: string;
  [args: string]: any;
}
