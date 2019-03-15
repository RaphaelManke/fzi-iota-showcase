import Vehicle from './vehicle';

export interface Environment {
  info: EnvironmentInfo;

  addVehicle(v: Vehicle, x: number, y: number): void;

  addMarker(id: string, x: number, y: number): void;

  getVehicle(id: string): Vehicle | undefined;
}

export interface EnvironmentInfo {
  width: number;
  height: number;
  stops: Stop[];
  connections: Connection[];
}

export interface Stop {
  id: number;
  name: string;
  x: number;
  y: number;
}

export interface Connection {
  type: Type;
  from: number;
  to: number;
}

export type Type = 'car' | 'bike' | 'tram';
