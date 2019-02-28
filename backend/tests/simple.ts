import Car from '../src/mock/vehicleMock';
import { EventEmitter2 } from 'eventemitter2';
import { enableLogging } from '../src/logger';
import Controller from '../src/controller';
import EnvironmentMock from '../src/mock/envMock';
import startWebsocket from '../src/websocket';

(async () => {
  const events = new EventEmitter2();
  enableLogging(events);
  startWebsocket(events);

  const env = new EnvironmentMock(events);
  const con = new Controller(events, env);
  con.setupEnv();

  env.addMarker('START', 0, 0);
  env.addMarker('HALF', 3, 0);

  const c: Car = new Car('1', events);
  env.addVehicle(c, 0, 0);
  c.setSpeed(1);
  c.rfidDetected('1234');

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
})();
