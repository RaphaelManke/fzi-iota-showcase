import { Vehicle } from './vehicle';
import { EnvironmentInfo } from './envInfo';

export interface Environment {
  info: EnvironmentInfo;

  addVehicle(v: Vehicle, x: number, y: number): void;

  addMarker(id: string, x: number, y: number): void;

  getVehicle(id: string): Vehicle | undefined;
}
