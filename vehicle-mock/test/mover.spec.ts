import { expect } from 'chai';
import 'mocha';
import { PathFinder, Connection } from '../src/pathFinder';
import { log } from 'fzi-iota-showcase-client';
import { Vehicle } from '../src/vehicle';
import { Observer } from '../src/observer';
import { Mover } from '../src/mover';

describe('Mover', () => {
  it('should move vehicle', async function() {
    this.timeout(60000);

    const stops = [
      {
        id: 'A',
        name: 'Marktplatz',
        position: {
          lat: 49.009525,
          lng: 8.405141,
        },
      },
      {
        id: 'B',
        name: 'Kronenplatz',
        position: {
          lat: 49.00938,
          lng: 8.408518,
        },
      },
      {
        id: 'C',
        name: 'Rüppurer Tor',
        position: {
          lat: 49.005752,
          lng: 8.41036,
        },
      },
    ];
    const connections: Connection[] = [
      {
        from: 'A',
        to: 'B',
        type: 'tram',
        path: [
          {
            lat: 49.00954,
            lng: 8.403885,
          },
          {
            lat: 49.009304,
            lng: 8.410162,
          },
          {
            lat: 49.00938,
            lng: 8.408518,
          },
        ],
      },
      {
        from: 'B',
        to: 'C',
        type: 'tram',
        path: [
          {
            lat: 49.00938,
            lng: 8.408518,
          },
          {
            lat: 49.009304,
            lng: 8.410162,
          },
          {
            lat: 49.007649,
            lng: 8.409987,
          },
          {
            lat: 49.005752,
            lng: 8.41036,
          },
        ],
      },
      {
        from: 'B',
        to: 'C',
        type: 'car',
        path: [
          {
            lat: 49.00938,
            lng: 8.408518,
          },
          {
            lat: 49.009304,
            lng: 8.410262,
          },
          {
            lat: 49.007649,
            lng: 8.410087,
          },
          {
            lat: 49.005752,
            lng: 8.41046,
          },
        ],
      },
    ];

    const pathFinder = new PathFinder(connections);
    const e: Observer = {
      posUpdated(pos) {
        log.debug('%O', pos);
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
        log.info('Departed');
      },
    };
    const v = new Vehicle(e, 'SEED', { lat: 49.00954, lng: 8.403885 }, 'A', {
      co2emission: 0,
      speed: 100,
      type: 'tram',
      driveStartingPolicy: 'AFTER_BOARDING',
      maxReservations: 1,
    });
    const mover = new Mover(v);
    const paths = pathFinder.getPaths(v.stop!, 'C', [v.info.type]);
    await mover.startDriving(paths[0], (stop) => e.reachedStop(stop));
    log.info('Arrived');
  });
});
