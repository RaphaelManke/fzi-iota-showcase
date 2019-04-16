import { Trytes } from '@iota/core/typings/types';

export interface ScheduleDescription {
  defaultTransferTime: number;
  mode: Mode;
  stops: Trytes[];
  forVehicle: string;
}

export enum Mode {
  RING,
  TURNING,
}
