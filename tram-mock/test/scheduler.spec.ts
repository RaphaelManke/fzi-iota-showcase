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

describe('Scheduler', () => {
  it('should move scheduled vehicle from one stop to the next', function() {
    this.timeout(20000);
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
    return new Promise<any>((res, rej) => {
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
      };
      const v = new Vehicle(e, 'SEED', { lat: 49.00954, lng: 8.403885 }, 'A', {
        co2emission: 0,
        speed: 10000000,
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

      mock.checkInAtCurrentStop();
      const scheduler = new ScheduleHandler(
        mock,
        {
          defaultTransferTime: 1000,
          forVehicle: '',
          mode: 'TURNING',
          stops: ['A', 'B', 'C'],
        },
        cons,
      );

      v.addObserver({
        reachedStop(stop) {
          if (stop === 'C') {
            scheduler.stopSchedule();
            res();
          }
        },
      });

      scheduler.startSchedule();
    });
  });
});
