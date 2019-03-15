import { Hash, Trytes } from '@iota/core/typings/types';
import { VehicleInfo } from '../vehicle';
import { fromTrytes } from './converter';

export class CheckInMessage {
  public static fromTrytes(input: Trytes): CheckInMessage {
    return fromTrytes(input, ['vehicleId', 'trits']);
  }

  constructor(public readonly vehicleId: Int8Array, public readonly tripChannelIndex: number,
              public readonly paymentAddress: Hash, public readonly price: number,
              public readonly reservationRate: number, public readonly validFrom?: Date, public reservationRoot?: Hash,
              public readonly vehicleInfo?: VehicleInfo, public readonly password?: Trytes) {
  }
}
