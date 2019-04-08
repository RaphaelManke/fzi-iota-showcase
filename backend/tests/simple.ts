import { enableLogging } from '../src/logger';
import { Server } from '../src/server';
import { Controller } from '../src/controller';
import { User, Connection } from '../src/envInfo';
import { Users } from '../src/users';
import { SafeEmitter } from '../src/events';
import { log } from 'fzi-iota-showcase-client';
import { Hash } from '@iota/core/typings/types';
import { VehicleDescription } from '../src/vehicleImporter';
import { getNextId } from '../src/idSupplier';

(async () => {
  const stops = [
    {
      id: generateSeed(),
      name: 'Marktplatz',
      position: {
        lat: 49.009525,
        lng: 8.405141,
      },
    },
    {
      id: generateSeed(),
      name: 'Kronenplatz',
      position: {
        lat: 49.00938,
        lng: 8.408518,
      },
    },
    {
      id: generateSeed(),
      name: 'Rüppurer Tor',
      position: {
        lat: 49.005752,
        lng: 8.41036,
      },
    },
  ];
  const connections: Connection[] = [
    {
      from: stops[0].id,
      to: stops[1].id,
      type: 'tram',
      path: [
        {
          lat: 49.00954,
          lng: 8.403885,
        },
        {
          lat: 49.00938,
          lng: 8.408518,
        },
      ],
    },
    {
      from: stops[1].id,
      to: stops[2].id,
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
      from: stops[1].id,
      to: stops[2].id,
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

  const vehicles: VehicleDescription[] = [
    {
      seed: generateSeed(),
      name: 'Lukas',
      channelCapacity: 10,
      stop: stops[0].id,
      price: 90000000,
      reservationRate: 4000000,
      type: 'tram',
      co2emission: 90000,
      speed: 50,
      maxReservations: 100,
    },
  ];

  const seeds = new Map<Hash, User>();
  seeds.set(
    'EWRTZJHGSDGTRHNGVDISUGHIFVDJFERHUFBGRZEUFSDHFEGBRVHISDJIFUBUHVFDSHFUERIBUJHDRGBCG',
    {
      balance: 1000000000,
      id: getNextId(),
      name: 'Peter',
      stop: stops[0].id,
      position: stops[0].position,
      loggedIn: false,
    },
  );
  const users = new Users(seeds);
  const events = new SafeEmitter();
  enableLogging(events);
  const c = new Controller(
    events,
    stops,
    connections,
    vehicles,
    users,
    'https://nodes.devnet.iota.org',
  );
  await c.setup();

  new Server(c).listen();
})();

function generateSeed(length = 81) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ9';
  const retVal = [];
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal[i] = charset.charAt(Math.floor(Math.random() * n));
  }
  const result = retVal.join('');
  return result;
}
