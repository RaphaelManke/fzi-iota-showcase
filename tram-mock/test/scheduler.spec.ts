import { expect } from 'chai';
import 'mocha';
import { log, createAttachToTangle } from 'fzi-iota-showcase-client';
import {
  VehicleMock,
  Vehicle,
  Observer,
  Connection,
} from 'fzi-iota-showcase-vehicle-mock';
import { composeAPI } from '@iota/core';
import { ScheduleHandler } from '../src/scheduleHandler';
import { TripState } from 'fzi-iota-showcase-vehicle-mock/out/tripState';
import { ScheduleDescription } from '../src/scheduleDescription';

describe('Scheduler', () => {
  const cons: Connection[] = [
    {
      from: 'A',
      to: 'B',
      type: 'tram',
      path: [
        {
          lat: 0,
          lng: 0,
        },
        {
          lat: 4,
          lng: 0,
        },
        {
          lat: 8,
          lng: 0,
        },
        {
          lat: 10,
          lng: 0,
        },
      ],
    },
    {
      from: 'B',
      to: 'C',
      type: 'tram',
      path: [
        {
          lat: 10,
          lng: 0,
        },
        {
          lat: 10,
          lng: 5,
        },
        {
          lat: 10,
          lng: 10,
        },
      ],
    },
    {
      from: 'B',
      to: 'C',
      type: 'tram',
      path: [
        {
          lat: 10,
          lng: 0,
        },
        {
          lat: 10,
          lng: 5,
        },
        {
          lat: 10,
          lng: 10,
        },
      ],
    },
  ];
  const e: Observer = {
    posUpdated(pos) {
      log.silly('%O', pos);
    },
    checkedIn(stop) {
      log.debug('Vehicle checked in at: %s', stop);
    },
    reachedStop(stop) {
      log.info('Vehicle reached stop %s', stop);
    },
    transactionReceived(value, user) {
      log.info('Transaction received');
    },
    transactionSent(value, user) {
      log.info('Transaction sent');
    },
    tripStarted(userId, start, dest) {
      log.info('Trip started');
    },
    departed(stop, destination) {
      log.info('Departed from %s', stop);
    },
  };

  const schedule: ScheduleDescription = {
    defaultTransferTime: 4000,
    forVehicle: '',
    mode: 'TURNING',
    stops: ['A', 'B', 'C'],
  };

  const getVehicle = (speed: number) => {
    const v = new Vehicle(e, 'SEED', { lat: 49.00954, lng: 8.403885 }, 'A', {
      co2emission: 0,
      speed,
      type: 'tram',
      driveStartingPolicy: 'MANUAL',
      maxReservations: 1,
    });
    const provider = 'https://nodes.devnet.iota.org';
    const iota = composeAPI({
      provider,
      attachToTangle: createAttachToTangle(provider),
    });
    const mock = new VehicleMock(
      v,
      10,
      1,
      1,
      provider,
      iota,
      3,
      14,
      true,
      true,
    );

    const scheduler = new ScheduleHandler(mock, schedule, cons);
    return { scheduler, mock, v };
  };

  it('should move scheduled vehicle from one stop to the next', function(done) {
    this.timeout(60000);

    const { v, scheduler } = getVehicle(1000000);

    ScheduleHandler.START_DELAY = 25000;
    v.addObserver({
      reachedStop(stop) {
        if (stop === 'C') {
          scheduler.stopSchedule();
          done();
        }
      },
    });

    scheduler.startSchedule();
  });

  it('should calculate validFrom/to times correctly', function(done) {
    this.timeout(60000);

    const { v, mock, scheduler } = getVehicle(500000);
    ScheduleHandler.START_DELAY = 25000;
    scheduler.startSchedule();

    v.addObserver({
      departed(stop) {
        if (stop === 'A') {
          log.info(
            '%O',
            Object.getOwnPropertyDescriptor(v, 'trips')!.value.map(
              ({
                checkInMessage: { validFrom, validUntil },
                start,
              }: TripState) => ({
                start,
                validFrom,
                validUntil,
              }),
            ),
          );
        }
      },
      reachedStop(stop) {
        if (stop === 'C') {
          scheduler.stopSchedule();
          done();
        }
      },
    });
  });
});
