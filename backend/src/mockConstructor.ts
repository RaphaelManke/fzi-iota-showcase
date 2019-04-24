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
import { log } from 'fzi-iota-showcase-client';

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
        driveStartingPolicy: v.driveStartingPolicy
          ? v.driveStartingPolicy
          : 'AFTER_BOARDING',
        maxReservations: v.maxReservations ? v.maxReservations : 1,
      },
      trips: [],
      checkIns: [],
      name: v.name,
      position: this.stops.get(v.stop)!.position,
      balance: 0,
    };

    const events = this.events;

    const e: Observer = {
      checkedIn(stop, checkInMessage) {
        info.checkIns.push({ stop, message: checkInMessage });
        events.emit('CheckIn', { stopId: stop, vehicleId: info.id });
      },

      departed(stop, destination) {
        info.stop = undefined;
        events.emit('Departed', { vehicleId: info.id, stop, destination });
      },

      posUpdated(pos) {
        info.position = pos;
        events.emit('PosUpdated', { id: info.id, position: pos });
      },

      reachedStop(stop) {
        info.stop = stop;
        const checkIn = info.checkIns[0];
        const allowedDestinations = [];
        if (checkIn) {
          if (checkIn.stop === stop) {
            if (checkIn.message.vehicleInfo) {
              allowedDestinations.push(
                ...checkIn.message.vehicleInfo.allowedDestinations,
              );
            }
          } else {
            log.warn(
              'First checkIn of vehicle %s is not for reached stop %s',
              info.id,
              stop,
            );
          }
        }
        events.emit('ReachedStop', {
          stopId: stop,
          vehicleId: info.id,
          allowedDestinations,
        });
      },
      tripStarted(userId, start, destination, price) {
        events.emit('TripStarted', {
          vehicleId: info.id,
          userId,
          start,
          destination,
          price,
        });
      },
      transactionReceived(amount, user) {
        events.emit('PaymentIssued', { from: user, to: info.id, amount });
      },
      transactionSent(amount, user) {
        events.emit('PaymentIssued', { from: info.id, to: user, amount });
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
