import { ScheduleDescription } from './scheduleDescription';
import {
  VehicleMock,
  Vehicle,
  PathFinder,
  Connection,
  Path,
} from 'fzi-iota-showcase-vehicle-mock';
import { log, CheckInMessage } from 'fzi-iota-showcase-client';
import { getPathLength } from 'geolib';
import { scheduleJob, Job } from 'node-schedule';
import * as Queue from 'promise-queue';
import * as retry from 'bluebird-retry';

export class ScheduleHandler {
  public static START_DELAY = 40000;
  public static MINIMUM_TRANSFER_TIME = 2000;

  private readonly vehicle: Vehicle;
  private readonly pathFinder: PathFinder;

  private started = false;
  private doCheckIn = true;
  private current = 0;
  private last = { index: 0, forward: true };
  private forward = true;
  private startedCheckIns: Array<{
    departure: Date;
    promise: Promise<any>;
  }> = [];
  private job?: Job;
  private lastValidFrom?: Date;
  private queue = new Queue(1);

  constructor(
    private mock: VehicleMock,
    private schedule: ScheduleDescription,
    connections: Connection[],
    private tripIndex = 1,
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
    const self = this;
    const startNextTrip = this.getStartNextTrip();
    const scheduleDeparture = () => {
      let departure = self.startedCheckIns[0].departure;
      if (departure.getTime() <= Date.now()) {
        log.warn(
          'Departure time of vehicle %s is expired. Executing in %s ms.',
          schedule.forVehicle,
          ScheduleHandler.MINIMUM_TRANSFER_TIME,
        );
        departure = new Date(
          Date.now() + ScheduleHandler.MINIMUM_TRANSFER_TIME,
        );
      }
      self.job = scheduleJob(departure, startNextTrip);
    };

    this.mock.vehicle.addObserver({
      reachedStop() {
        if (self.started) {
          scheduleDeparture();
        }
      },
      departed(stop) {
        if (self.started && self.lastValidFrom) {
          const departure = new Date(
            self.lastValidFrom.getTime() + schedule.defaultTransferTime,
          );

          if (self.doCheckIn) {
            const retriedCheckIn = () =>
              Promise.resolve(
                retry((c: CheckInMessage) =>
                  self.mock
                    .checkIn(
                      stop,
                      self.tripIndex!++,
                      self.lastValidFrom,
                      departure,
                      getDests(self.last.index, self.last.forward, schedule),
                    )
                    .catch((reason) => {
                      log.error(
                        'Check in for \'%s\' failed. ' +
                          (reason.message || reason),
                        schedule.forVehicle,
                      );
                      self.doCheckIn = false;
                    }),
                ),
              );
            const checkIn = self.queue.add(retriedCheckIn);
            self.startedCheckIns.push({
              promise: checkIn,
              departure,
            });
          }
          const nextStop = self.schedule.stops[self.current];
          const [path] = self.pathFinder.getPaths(
            self.vehicle.stop!,
            nextStop,
            [self.vehicle.info.type],
          );
          self.lastValidFrom = getArrivalTime(
            departure,
            path,
            self.vehicle.info.speed,
          );
        }
      },
    });

    const startSchedule = new Date(Date.now() + ScheduleHandler.START_DELAY);
    this.getPublishSchedule()(startSchedule);

    scheduleDeparture();
    this.started = true;
  }

  public stopSchedule() {
    if (this.job) {
      this.job.cancel();
      this.started = false;
    }
  }

  private getPublishSchedule(self = this) {
    return (start = new Date()) => {
      const schedule = self.schedule;
      // check into all stops until vehicle reaches current stops again
      let i = self.current;
      let forward = self.forward;
      let arrival = start;
      while (
        self.startedCheckIns.length === 0 ||
        !(i === self.current && forward === self.forward)
      ) {
        const stop = schedule.stops[i];
        const tripIndex = self.tripIndex!++;
        const departure = new Date(
          arrival.getTime() + schedule.defaultTransferTime,
        );
        const thisArrival = arrival;
        const dests = getDests(i, forward, schedule);
        if (self.doCheckIn) {
          const checkIn = self.queue.add(() =>
            Promise.resolve(
              retry((c: CheckInMessage) =>
                self.mock
                  .checkIn(stop, tripIndex, thisArrival, departure, dests)
                  .catch((reason) => {
                    log.error(
                      'Check in for \'%s\' failed. ' + (reason.message || reason),
                      schedule.forVehicle,
                    );
                    self.doCheckIn = false;
                  }),
              ),
            ),
          );
          self.startedCheckIns.push({ promise: checkIn, departure });
        }
        ({ current: i, forward } = getNextIndex(i, schedule, forward));
        const [p] = self.pathFinder.getPaths(stop, schedule.stops[i], [
          self.vehicle.info.type,
        ]);
        arrival = getArrivalTime(departure, p, self.vehicle.info.speed);
        self.lastValidFrom = arrival;
      }
    };
  }

  private getStartNextTrip() {
    const self = this;
    return async () => {
      self.last = { index: self.current, forward: self.forward };
      ({ current: self.current, forward: self.forward } = getNextIndex(
        self.current,
        self.schedule,
        self.forward,
      ));

      const checkIn = self.startedCheckIns.shift();
      if (checkIn) {
        await checkIn.promise; // wait until checkIn for current stop resolves
      }

      if (self.vehicle.trip) {
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
        self.started = false;
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

function getArrivalTime(departure: Date, p: Path, speed: number) {
  const distance = getPathLength(
    p.waypoints.map((pos) => ({
      latitude: pos.lat,
      longitude: pos.lng,
    })),
  );
  return new Date(departure.getTime() + (distance * 1000) / speed);
}
