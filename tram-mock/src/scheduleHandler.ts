import { ScheduleDescription, Mode } from './scheduleDescription';
import {
  VehicleMock,
  Vehicle,
  PathFinder,
  Connection,
} from 'fzi-iota-showcase-vehicle-mock';
import { log } from 'fzi-iota-showcase-client';
import { getPathLength } from 'geolib';

export class ScheduleHandler {
  private current = 0;
  private forward = true;
  private vehicle: Vehicle;
  private pathFinder: PathFinder;
  private started = false;
  private timeout?: NodeJS.Timer;
  private startedCheckIns: Array<Promise<any>> = [];
  private tripIndex?: number;

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

  public startSchedule(startingIndex = 1) {
    this.tripIndex = startingIndex;
    while (this.schedule.stops[this.current] !== this.vehicle.stop) {
      this.current++;
      if (this.current >= this.schedule.stops.length) {
        throw new Error('Vehicle is not checked in at stop in schedule');
      }
    }
    const schedule = this.schedule;
    const startNextTrip = this.getStartNextTrip();
    const scheduleDeparture = () =>
      (this.timeout = setTimeout(startNextTrip, schedule.defaultTransferTime));
    const self = this;
    this.mock.vehicle.addObserver({
      reachedStop() {
        if (self.started) {
          scheduleDeparture();
        }
      },
    });

    this.getPublishSchedule(this)();
    this.startedCheckIns.shift()!.then(scheduleDeparture);
    this.started = true;
  }

  public stopSchedule() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.started = false;
    }
  }

  private getPublishSchedule(self = this) {
    return () => {
      const schedule = self.schedule;
      // check into all stops until vehicle reaches current stops again
      let i = self.current;
      let forward = self.forward;
      let start = new Date();
      while (
        self.startedCheckIns.length === 0 ||
        !(i === self.current && forward === self.forward)
      ) {
        const stop = schedule.stops[i];
        const departure = new Date(
          start.getTime() + schedule.defaultTransferTime,
        );
        self.startedCheckIns.push(
          self.mock.checkIn(
            stop,
            self.tripIndex!++,
            start,
            departure,
            getDests(i, forward, schedule),
          ),
        );
        ({ current: i, forward } = getNextIndex(i, schedule, forward));
        const [p] = self.pathFinder.getPaths(stop, schedule.stops[i], [
          self.vehicle.info.type,
        ]);
        const distance = getPathLength(
          p.waypoints.map((pos) => ({
            latitude: pos.lat,
            longitude: pos.lng,
          })),
        );
        start = new Date(
          departure.getTime() + distance / self.vehicle.info.speed,
        );
      }
    };
  }

  private getStartNextTrip() {
    const self = this;
    return async () => {
      if (self.vehicle.trip) {
        ({ current: self.current, forward: self.forward } = getNextIndex(
          self.current,
          self.schedule,
          self.forward,
        ));

        if (self.startedCheckIns.length === 0) {
          self.getPublishSchedule(self)();
        }
        await self.startedCheckIns.shift(); // wait until checkIn for current stop resolves

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

function getNextIndex(
  current: number,
  schedule: ScheduleDescription,
  forward: boolean,
) {
  if (current === 0 && schedule.mode === 'TURNING') {
    current = 1;
  } else {
    if (current === schedule.stops.length - 1) {
      if (schedule.mode === 'TURNING') {
        current--;
      } else {
        current = 0;
      }
    } else {
      current += forward ? 1 : -1;
    }
  }
  if (current === 0 || current === schedule.stops.length - 1) {
    forward = !forward;
  }
  return { current, forward };
}

function getDests(i: number, forward: boolean, schedule: ScheduleDescription) {
  const from = schedule.stops.slice(i + 1, schedule.stops.length);
  const upTo = schedule.stops.slice(0, i);
  return schedule.mode === 'RING' ? [...from, ...upTo] : forward ? from : upTo;
}
