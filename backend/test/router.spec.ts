import { log } from '../../client/src/logger';
import { expect } from 'chai';
import { Router } from '../src/router';
import 'mocha';
import { Connection } from '../src/envInfo';
import { VehicleInfo } from '../src/vehicleInfo';

describe('Router', () => {
  it('should return multiple routes', () => {
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
    const vehicles: VehicleInfo[] = [
      {
        id: 'A',
        name: 'Lukas',
        balance: 0,
        info: {
          type: 'tram',
          speed: 100,
          co2emission: 0,
          maxReservations: 100,
        },
        position: {
          lat: 49.00954,
          lng: 8.403885,
        },
        checkIn: {
          stop: 'A',
          message: {
            price: 1000,
            vehicleId: new Int8Array(0),
            hashedNonce: '',
            paymentAddress: '',
            reservationRate: 20000,
            reservationRoot: 'ASD',
            tripChannelIndex: 1,
          },
        },
      },
      {
        id: 'B',
        name: 'Tessy',
        balance: 0,
        info: {
          type: 'car',
          speed: 83,
          co2emission: 0,
          maxReservations: 1,
        },
        position: {
          lat: 49.00938,
          lng: 8.408518,
        },
        checkIn: {
          stop: 'B',
          message: {
            price: 1000,
            vehicleId: new Int8Array(0),
            hashedNonce: '',
            paymentAddress: '',
            reservationRate: 20000,
            reservationRoot: 'ASD',
            tripChannelIndex: 1,
          },
        },
      },
    ];
    const r = new Router(connections, vehicles);
    const routes = r.getRoutes('A', 'C', ['car', 'tram']);
    log.info('%o', routes);
  });
});
