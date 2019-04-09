import { enableLogging } from '../src/logger';
import { Server } from '../src/server';
import { Controller } from '../src/controller';
import { Connection, Stop } from '../src/envInfo';
import { Users } from '../src/users';
import { SafeEmitter } from '../src/events';
import { log } from 'fzi-iota-showcase-client';
import { VehicleDescription } from '../src/vehicleImporter';
import { readVehicles } from '../src/vehicleImporter';
import * as minimist from 'minimist';
import * as fs from 'fs';

(async () => {
  try {
    const args = minimist(process.argv.slice(2), {
      default: {
        vehicles: './vehicles.json',
        stops: './stops.json',
        connections: './connections.json',
        users: './users.json',
      },
    });

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
    const users = Users.fromFile(args.users);

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
