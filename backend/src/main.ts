import { enableLogging } from './logger';
import { Server } from './server';
import { Controller } from './controller';
import { Connection, Stop } from './envInfo';
import { Users } from './users';
import { SafeEmitter } from './events';
import { log, createAttachToTangle } from 'fzi-iota-showcase-client';
import { VehicleDescription } from './vehicleImporter';
import { readVehicles } from './vehicleImporter';
import * as minimist from 'minimist';
import * as fs from 'fs';
import { composeAPI } from '@iota/core';

(async () => {
  try {
    const args = minimist(process.argv.slice(2), {
      boolean: ['mockPayments', 'mockMessages'],
      default: {
        vehicles: './vehicles.json',
        stops: './stops.json',
        connections: './connections.json',
        users: './users.json',
        mockPayments: false,
        mockMessages: false,
        logLevel: 'debug',
      },
    });
    log.level = args.logLevel;
    log.info('Starting server...');
    log.info('Parameters: %O', args);

    log.info('Reading environment settings from files...');
    const stops: Stop[] = JSON.parse(fs.readFileSync(args.stops).toString());
    const connections: Connection[] = JSON.parse(
      fs.readFileSync(args.connections).toString(),
    );
    const vehicles: VehicleDescription[] = readVehicles(args.vehicles);
    // TODO
    vehicles
      .filter((v) => v.seed.length === 0)
      .forEach((v) => (v.seed = generateSeed()));

    const provider = 'https://nodes.devnet.iota.org';
    const iota = composeAPI({
      provider,
      attachToTangle: createAttachToTangle(),
    });

    const users = Users.fromFile(args.users, {
      iota,
      mockPayments: args.mockPayments,
    });
    await users.initUsers();

    const events = new SafeEmitter();

    const c = new Controller(
      events,
      stops,
      connections,
      vehicles,
      users,
      provider,
      iota,
      args.mockPayments,
      args.mockMessages,
    );
    await c.setup();

    new Server(c).listen();
  } catch (e) {
    log.error(e);
  }
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
