import Car from '../src/mock/vehicleMock';
import { EventEmitter2 } from 'eventemitter2';
import { enableLogging } from '../src/logger';
import Controller from '../src/controller';
import EnvironmentMock from '../src/mock/envMock';
import { Server } from '../src/server';
import { EnvironmentInfo, Type, Connection } from '../src/envInfo';

(async () => {
  const info: EnvironmentInfo = {
    vehicles: [{
      balance: 42,
      id: 'ABC',
      name: 'Tessi',
      position: {
        lat: 49.009525,
        lng: 8.405141,
      },
       info: {
         type: 'car',
         co2emission: 90000,
         speed: 50,
       },
    }],
    users: [],
    stops: [{
      id: 'A',
      name: 'Marktplatz',
      lat:  49.009525,
      lng: 8.405141,
    }, {
      id: 'B',
      name: 'Kronenplatz',
      lat:  49.009380,
      lng: 8.408518,
    }],
    connections: new Array<Type>('car', 'tram').map((type: Type) => [1].map((i) => ({
      from: i - 1,
      to: i,
      type,
      path: [],
    }))).reduce((acc: Connection[], v: Connection[]) => {
      v.forEach((c: Connection) => acc.push(c));
      return acc;
    }, []),
  };
  const events = new EventEmitter2();
  const env = new EnvironmentMock(info, events);
  const con = new Controller(events, env);
  enableLogging(events);
  new Server(con).listen();

  events.on('start', () => {
    con.setupEnv();

    env.addMarker('START', 0, 0);
    env.addMarker('HALF', 3, 0);

    const c: Car = new Car('1', events);
    env.addVehicle(c, 0, 0);
    c.speed = 1;

    // restart veh. after delay when it reaches second marker
    const cb = (data: any) => {
      if (data.markerId === 'HALF') {
        setTimeout(() => {
          c.start();
          events.off('markerDetected', cb);
        }, 4000);
      }
    };
    events.on('markerDetected', cb);
  });
})();
