import { EventEmitter2 } from 'eventemitter2';
import Environment from './env';

export default class Controller {
  // assume that exacly 1 vehicle can enter a specific marker, because roadways are seperated
  // thus markerid implicates vehicle
  public lastTimeDetected = new Map<string, number>();
  public events: EventEmitter2;
  public env: Environment;

  constructor(events: EventEmitter2, env: Environment) {
    this.events = events;
    this.env = env;
  }

  public setupEnv() {
    // clear detected markers when last sent event is too old. this means veh. has left marker area
    setInterval(() => {
      Array.from(this.lastTimeDetected.keys()).forEach((e: string) => {
        const v = this.lastTimeDetected.get(e);
        // longer than period of sent marker events
        if (v !== undefined && Date.now() - v > 1500) {
          this.lastTimeDetected.delete(e);
          console.log('cleared last time updated');
        }
      });
    }, 1000);

    this.events.on('markerDetected', (data) => {
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

    this.events.on('rfidDetected', (data) => {
      const v = this .env.getVehicle(data.id);
      if (v) {
        v.start();
      }
    });

    this.events.on('rfidRemoved', (data) => {
      const v = this.env.getVehicle(data.id);
      if (v) {
        v.stop();
      }
    });

    return this.env;
  }
}
