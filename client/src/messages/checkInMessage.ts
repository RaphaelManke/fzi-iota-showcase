import { Hash } from '@iota/core/typings/types';
import { VehicleInfo } from '../vehicle';
import { Trytes } from '@iota/core/typings/types';

export interface CheckInMessage {
  readonly vehicleId: Int8Array;
  readonly tripChannelIndex: number;
  readonly paymentAddress: Hash;
  readonly price: number;
  readonly reservationRate: number;
  readonly vehicleInfo?: VehicleInfo;
  readonly password?: Trytes;
}
