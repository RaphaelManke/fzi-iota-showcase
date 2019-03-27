import { Vehicle } from './vehicle';
import { EnvironmentInfo } from './envInfo';
import { Trytes } from '@iota/core/typings/types';

export interface Environment {
  info: EnvironmentInfo;

  addVehicle(v: Vehicle, lat: number, lng: number): void;

  addMarker(id: Trytes, lat: number, lng: number): void;

  getVehicle(id: Trytes): Vehicle | undefined;
}
