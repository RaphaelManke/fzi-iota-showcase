import { TripStarter } from '../src/tripStarter';
import * as fs from 'fs';
import { Stop, Connection } from '../src/envInfo';
import 'mocha';
import { SafeEmitter } from '../src/events';
import { Users } from '../src/users';
import { MockConstructor } from '../src/mockConstructor';
import { composeAPI, AccountData } from '@iota/core';
import { getNextId } from '../src/idSupplier';
import { Trytes } from '@iota/core/typings/types';
import { VehicleDescription } from '../src/vehicleImporter';
import { enableLogging } from '../src/logger';
import { log } from 'fzi-iota-showcase-client';

describe('Trip Starter', () => {
  const stops: Stop[] = JSON.parse(
    fs.readFileSync('./config/stops.json').toString(),
  );
  const connections: Connection[] = JSON.parse(
    fs.readFileSync('./config/connections.json').toString(),
  );

  const getStop = (name: string) => stops.find((s) => s.name === name);

  it('should process a trip', async function() {
    this.timeout(180000);

    const events = new SafeEmitter();
    enableLogging(events, (id) => id === 'A');

    const stopMap = new Map<Trytes, Stop>();
    stops.forEach((s) => stopMap.set(s.id, s));
    const mock = new MockConstructor(
      events,
      stopMap,
      '',
      composeAPI(),
      9,
      getNextId,
      true,
      true,
    );
    const desc: VehicleDescription = {
      channelCapacity: 2,
      co2emission: 0,
      maxReservations: 100,
      name: 'Lukas',
      price: 30000,
      reservationRate: 0,
      seed: '9'.repeat(81),
      speed: 35,
      stop: getStop('Marktplatz')!.id,
      type: 'tram',
    };
    const v = mock.construct(desc);

    await Promise.all([
      v.mock.syncTangle().then(() => v.mock.checkInAtCurrentStop()),
      v.mock
        .setupPayments()
        .then((ad: AccountData) => (v.info.balance = ad.balance)),
    ]);

    const users = Users.fromFile('./config/users.json', {
      mockPayments: true,
      mwm: 5,
      iota: composeAPI(),
    });
    users.initUsers();

    try {
      const tripStarter = new TripStarter(connections, events);
      await tripStarter.startTrip(
        v,
        users.getBySeed(
          'EWRTZJHGSDGTRHNGVDISUGHIFVDJFERHUFBGRZEUFSDHFEGBRVHISDJIFUBUHVFDSHFUERIBUJHDRGBCG',
        )!,
        getStop('Marktplatz')!.id,
        getStop('Rüppurer Tor')!.id,
        [getStop('Kronenplatz')!.id],
      );
    } catch (e) {
      log.error(e);
    }
  });
});

function generateNonce(length = 81) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ9';
  const retVal = [];
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal[i] = charset.charAt(Math.floor(Math.random() * n));
  }
  const result = retVal.join('');
  return result;
}
