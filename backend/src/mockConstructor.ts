import { SafeEmitter } from './events';
import { Trytes } from '@iota/core/typings/types';
import { Stop } from './envInfo';
import { API } from '@iota/core';
import { VehicleDescription } from './vehicleImporter';
import {
  VehicleMock,
  Observer,
  Vehicle as MockedVehicle,
} from 'fzi-iota-showcase-vehicle-mock';
import { VehicleInfo } from './vehicleInfo';
import { getNextId } from './idSupplier';

export class MockConstructor {
  constructor(
    private events: SafeEmitter,
    private stops: Map<Trytes, Stop>,
    private provider: string,
    private iota: API,
    private idSupplier: () => Trytes = getNextId,
    private mockPayments = false,
    private mockMessages = false,
  ) {}

  public construct(v: VehicleDescription) {
    const info: VehicleInfo = {
      id: this.idSupplier(),
      info: {
        type: v.type,
        co2emission: v.co2emission,
        speed: v.speed,
        maxReservations: v.maxReservations ? v.maxReservations : 1,
      },
      name: v.name,
      position: this.stops.get(v.stop)!.position,
      balance: 0,
    };

    const events = this.events;

    const e: Observer = {
      checkedIn(stop, checkInMessage) {
        info.checkIn = { stop, message: checkInMessage };
        events.emit('CheckIn', { stopId: stop, vehicleId: info.id });
      },

      posUpdated(pos) {
        info.position = pos;
        events.emit('PosUpdated', { id: info.id, position: pos });
      },

      reachedStop(stop) {
        events.emit('ReachedStop', { stopId: stop, vehicleId: info.id });
      },
    };

    const mock = new VehicleMock(
      new MockedVehicle(
        e,
        v.seed,
        this.stops.get(v.stop)!.position,
        v.stop,
        info.info,
      ),
      v.channelCapacity,
      v.price,
      v.reservationRate,
      this.provider,
      this.iota,
      3,
      14,
      this.mockPayments,
      this.mockMessages,
    );
    return { info, mock };
  }
}
