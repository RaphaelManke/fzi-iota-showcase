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
import { ScheduleDescription } from 'fzi-iota-showcase-tram-mock';

(async () => {
  try {
    const args = minimist(process.argv.slice(2), {
      boolean: ['mockPayments', 'mockMessages'],
      default: {
        vehicles: './config/vehicles.json',
        stops: './config/stops.json',
        connections: './config/connections.json',
        users: './config/users.json',
        schedules: './config/schedules.json',
        provider: 'https://nodes.devnet.iota.org',
        mwm: 9,
        mockPayments: false,
        mockMessages: false,
        logLevel: 'debug',
        parallelInit: true,
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

    vehicles
      .filter((v) => v.seed.length === 0)
      .forEach((v) => (v.seed = generateSeed()));

    const iota = composeAPI({
      provider: args.provider,
      attachToTangle: createAttachToTangle(args.provider),
    });
    if (!(args.mockMessages && args.mockPayments)) {
      log.info('IOTA node: %O', await iota.getNodeInfo());
    }

    const users = Users.fromFile(args.users, {
      iota,
      mockPayments: args.mockPayments,
      mwm: args.mwm,
    });
    await users.initUsers(args.parallelInit);

    const schedules: ScheduleDescription[] = JSON.parse(
      fs.readFileSync(args.schedules).toString(),
    );

    const events = new SafeEmitter();

    const c = new Controller(
      events,
      stops,
      connections,
      vehicles,
      schedules,
      users,
      args.provider,
      iota,
      args.mwm,
      args.mockPayments,
      args.mockMessages,
      args.masterSeed,
    );
    c.setup().initVehicles(args.parallelInit);

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
