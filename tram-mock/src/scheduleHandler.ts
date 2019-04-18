import { ScheduleDescription, Mode } from './scheduleDescription';
import {
  VehicleMock,
  Vehicle,
  PathFinder,
  Connection,
} from 'fzi-iota-showcase-vehicle-mock';
import { log } from 'fzi-iota-showcase-client';

export class ScheduleHandler {
  private current = 0;
  private forward = true;
  private vehicle: Vehicle;
  private pathFinder: PathFinder;
  private started = false;
  private timeout?: NodeJS.Timer;

  constructor(
    private mock: VehicleMock,
    private schedule: ScheduleDescription,
    connections: Connection[],
  ) {
    this.vehicle = mock.vehicle;
    const cons = [];
    for (let i = 1; i < schedule.stops.length; i++) {
      const from = schedule.stops[i - 1];
      const to = schedule.stops[i];
      let add = connections.find(
        (c) => c.from === from && c.to === to && c.type === this.vehicle.info.type,
      );
      if (!add) {
        add = connections.find(
          (c) =>
            c.from === to && c.to === from && c.type === this.vehicle.info.type,
        );
      }
      if (!add) {
        throw new Error(`No connection from ${from} to ${to} exists.`);
      } else {
        cons.push(add);
      }
    }
    this.pathFinder = new PathFinder(cons);
  }

  public startSchedule() {
    while (this.schedule.stops[this.current] !== this.vehicle.stop) {
      this.current++;
      if (this.current >= this.schedule.stops.length) {
        throw new Error('Vehicle is not checked in at stop in schedule');
      }
    }
    const schedule = this.schedule;
    const start = this.getStartNextTrip();
    const scheduleDeparture = () =>
      (this.timeout = setTimeout(start, schedule.defaultTransferTime));
    const mock = this.mock;
    const self = this;
    this.mock.vehicle.addObserver({
      reachedStop() {
        if (self.started) {
          // TODO vehicle should check in in advance and not when reached stop
          mock.checkInAtCurrentStop().then(scheduleDeparture);
        }
      },
    });
    scheduleDeparture();
    this.started = true;
  }

  public stopSchedule() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.started = false;
    }
  }

  private getStartNextTrip() {
    const self = this;
    return () => {
      if (self.vehicle.trip) {
        if (self.current === 0 && self.schedule.mode === 'TURNING') {
          self.current = 1;
          self.forward = true;
        } else {
          if (self.current === self.schedule.stops.length - 1) {
            if (self.schedule.mode === 'TURNING') {
              self.current--;
              self.forward = false;
            } else {
              self.current = 0;
            }
          } else {
            self.current += self.forward ? 1 : -1;
          }
        }
        const nextStop = self.schedule.stops[self.current];
        const [path] = self.pathFinder.getPaths(self.vehicle.stop!, nextStop, [
          self.vehicle.info.type,
        ]);
        self.vehicle.trip.path = path;
        self.vehicle.trip.destination = nextStop;
        self.mock.startDriving();
      } else {
        log.error(
          'Scheduled vehicle is not checkIn at current stop in schedule.',
        );
      }
    };
  }
}
