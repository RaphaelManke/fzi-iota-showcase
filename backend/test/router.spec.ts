import { log } from 'fzi-iota-showcase-client';
import { expect } from 'chai';
import { Router } from '../src/router';
import 'mocha';
import { Connection, Stop } from '../src/envInfo';
import { VehicleInfo } from '../src/vehicleInfo';
import * as fs from 'fs';

describe('Router', () => {
  const stops: Stop[] = JSON.parse(
    fs.readFileSync('./config/stops.json').toString(),
  );
  const connections: Connection[] = JSON.parse(
    fs.readFileSync('./config/connections.json').toString(),
  );

  const getStop = (name: string) => stops.find((s) => s.name === name);

  function vehicle(stopName: string, type: string): VehicleInfo {
    return {
      id: generateNonce(),
      name: '',
      balance: 0,
      info: {
        type,
        speed: 100,
        co2emission: 0,
        maxReservations: 100,
        driveStartingPolicy: type === 'tram' ? 'MANUAL' : 'AFTER_BOARDING',
      },
      position: {
        lat: 49.00954,
        lng: 8.403885,
      },
      trips: [],
      checkIns: [
        {
          stop: getStop(stopName)!.id,
          message: {
            price: 1000,
            vehicleId: new Int8Array(0),
            hashedNonce: '',
            paymentAddress: '',
            reservationRate: 20000,
            reservationRoot: '',
            tripChannelIndex: 1,
          },
        },
      ],
    };
  }

  it('should return multiple routes', () => {
    const vehicles: VehicleInfo[] = [
      vehicle('Karlstor', 'tram'),
      vehicle('Kronenplatz', 'car'),
    ];
    const r = new Router(connections, vehicles);
    const routes = r.getRoutes(
      getStop('Karlstor')!.id,
      getStop('Rüppurer Tor')!.id,
      ['car', 'tram'],
    );
    log.info('%o', routes);
    expect(routes.length).equals(2);
  });

  it('should process routes with multiple section choices', () => {
    const vehicles: VehicleInfo[] = [
      vehicle('Karlstor', 'tram'),
      ...['Karlstor', 'Rüppurer Tor', 'Kronenplatz'].map((s) =>
        vehicle(s, 'car'),
      ),
      ...['Karlstor', 'Marktplatz', 'ECE Center', 'Kronenplatz'].map((s) =>
        vehicle(s, 'bike'),
      ),
    ];
    const r = new Router(connections, vehicles);
    const routes = r.getRoutes(
      getStop('Karlstor')!.id,
      getStop('Rüppurer Tor')!.id,
      ['car', 'tram', 'bike'],
    );
    log.info('%o', routes);
  });

  it('should process routes with multiple vehicle choices', () => {
    const vehicles: VehicleInfo[] = [
      vehicle('Karlstor', 'tram'),
      ...['Karlstor', 'Rüppurer Tor', 'Kronenplatz'].map((s) =>
        vehicle(s, 'car'),
      ),
      vehicle('Europaplatz', 'bike'),
      vehicle('Europaplatz', 'bike'),
    ];
    const r = new Router(connections, vehicles);
    const routes = r.getRoutes(
      getStop('Karlstor')!.id,
      getStop('Rüppurer Tor')!.id,
      ['car', 'tram', 'bike'],
    );
    log.info('%o', routes);
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
