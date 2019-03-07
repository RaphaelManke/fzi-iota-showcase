import {Trip} from './trip';

export class Vehicle {
  constructor(public readonly info: VehicleInfo, public readonly trips: Trip[] = []) {
  }
}

export interface VehicleInfo {
  type?: string;
  [args: string]: any;
}
