import { EventEmitter2 } from 'eventemitter2';
import { Environment } from './env';
import { log } from 'fzi-iota-showcase-client';
import { SafeEmitter } from './events';

export default class Controller {
  // assume that exacly 1 vehicle can enter a specific marker, because roadways are seperated
  // thus markerid implicates vehicle
  private lastTimeDetected = new Map<string, number>();

  constructor(public events: SafeEmitter, public env: Environment) {
  }

  public setupEnv() {
    // clear detected markers when last sent event is too old. this means veh. has left marker area
    setInterval(() => {
      Array.from(this.lastTimeDetected.keys()).forEach((e: string) => {
        const v = this.lastTimeDetected.get(e);
        // longer than period of sent marker events
        if (v !== undefined && Date.now() - v > 1500) {
          this.lastTimeDetected.delete(e);
          log.debug('cleared last time updated');
        }
      });
    }, 1000);

    this.events.onIntern('markerDetected', (data) => {
      const previous = this.lastTimeDetected.get(data.markerId);
      if (previous === undefined) {
        // vehicle has entered marker area -> stop vehicle
        const v = this.env.getVehicle(data.id);
        if (v) {
          v.stop();
        }
      }
      this .lastTimeDetected.set(data.markerId, Date.now());
    });

    return this.env;
  }
}
