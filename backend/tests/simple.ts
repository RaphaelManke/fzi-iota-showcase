import { enableLogging } from '../src/logger';
import Controller from '../src/controller';
import EnvironmentMock from '../src/mock/envMock';
import { Server } from '../src/server';
import { EnvironmentInfo } from '../src/envInfo';
import { SafeEmitter } from '../src/events';
import { log } from 'fzi-iota-showcase-client';
import { Router, Emitter, Vehicle, Mover } from 'fzi-iota-showcase-vehicle-mock';

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
      position: {
        lat:  49.009525,
        lng: 8.405141,
      },
    }, {
      id: 'B',
      name: 'Kronenplatz',
      position: {
        lat: 49.009380,
        lng: 8.408518,
      },
    }, {
      id: 'C',
      name: 'Rüppurer Tor',
      position: {
        lat: 49.005752,
        lng: 8.410360,
      },
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
      }, {
        lat: 49.009380,
        lng: 8.408518,
      }],
    }, {
      from: 'B',
      to: 'C',
      type: 'tram',
      path: [{
        lat: 49.009380,
        lng: 8.408518,
      }, {
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
        lat: 49.009380,
        lng: 8.408518,
      }, {
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

  events.onIntern('start', async () => {
    con.setupEnv();

    const router = new Router(info.connections);
    const e: Emitter = {
      posUpdated(pos) {
        info.vehicles[0].position = pos;
        events.emit('PosUpdated', {id: 'ABC', position: pos});
      },
    };
    const v = new Vehicle(e, 'SEED', {id: 'A', position: {lat: 49.009540, lng: 8.403885}},
      {co2emission: 0, speed: 83, type: 'tram'});
    const mover = new Mover(router, v, 'C');
    await mover.startDriving(() => log.info('Arrived'), (stop) => log.info('Reached stop %s', stop));
  });
})();
