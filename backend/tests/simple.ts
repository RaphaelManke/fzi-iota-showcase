import Car from '../src/mock/vehicleMock';
import { EventEmitter2 } from 'eventemitter2';
import { enableLogging } from '../src/logger';
import Controller from '../src/controller';
import EnvironmentMock from '../src/mock/envMock';
import { Server } from '../src/server';
import { EnvironmentInfo, Type, Connection } from '../src/envInfo';
import { SafeEmitter } from '../src/events';

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
    }, {
      id: 'C',
      name: 'Rüppurer Tor',
      lat: 49.005752,
      lng: 8.410360,
    }],
    connections: [{
      from: 'A',
      to: 'B',
      type: 'tram',
      path: [{
        lat: 49.009540,
        lng: 8.403885,
      }, {
        lat: 49.009304,
        lng: 8.410162,
      }],
    }, {
      from: 'B',
      to: 'C',
      type: 'tram',
      path: [{
        lat: 49.009304,
        lng: 8.410162,
      }, {
        lat: 49.007649,
        lng: 8.409987,
      }, {
        lat: 49.005752,
        lng: 8.410360,
      }],
    }, {
      from: 'B',
      to: 'C',
      type: 'car',
      path: [{
        lat: 49.009304,
        lng: 8.410262,
      }, {
        lat: 49.007649,
        lng: 8.410087,
      }, {
        lat: 49.005752,
        lng: 8.410460,
      }],
    }],
  };
  const events = new SafeEmitter();
  const env = new EnvironmentMock(info, events);
  const con = new Controller(events, env);
  enableLogging(events);
  new Server(con).listen();

  events.onIntern('start', () => {
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
          events.offIntern('markerDetected', cb);
        }, 4000);
      }
    };
    events.onIntern('markerDetected', cb);
  });
})();
