import { expect } from 'chai';
import 'mocha';
import { Router, Connection, Type } from '../src/router';
import { log } from 'fzi-iota-showcase-client';
import { Vehicle } from '../src/vehicle';
import { Emitter } from '../src/emitter';
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

    const router = new Router(connections);
    const e: Emitter = {
      posUpdated(pos) {
        log.debug('%O', pos);
      },
      checkedIn(stop) {
        log.debug('Vehicle checked in at: %s', stop);
      },
      tripStarted(dest) {
        log.debug('Trip started');
      },
      tripFinished(dest) {
        log.debug('Trip finished');
      },
    };
    const v = new Vehicle(
      e,
      'SEED',
      { lat: 49.00954, lng: 8.403885 },
      { co2emission: 0, speed: 83, type: 'tram' },
    );
    v.stop = 'A';
    const mover = new Mover(v);
    const routes = router.getRoutes(v.stop!, 'C', v.info.type as Type);
    await mover.startDriving(routes[0], (stop) =>
      log.info('Reached stop %s', stop),
    );
    log.info('Arrived');
  });
});
