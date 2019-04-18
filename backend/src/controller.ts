import {
  SafeEmitter,
  Login,
  Logout,
  TripStarted,
  TripFinished,
  PosUpdated,
  TransactionIssued,
} from './events';
import { EnvironmentInfo, Stop, Connection, User } from './envInfo';
import { Users } from './users';
import { VehicleDescription } from './vehicleImporter';
import { Trytes } from '@iota/core/typings/types';
import { API, composeAPI, AccountData } from '@iota/core';
import { VehicleInfo } from './vehicleInfo';
import { createAttachToTangle, log } from 'fzi-iota-showcase-client';
import { VehicleMock } from 'fzi-iota-showcase-vehicle-mock';
import { MockConstructor } from './mockConstructor';
import { RouteInfo } from './routeInfo';
import { Router } from './router';
import { UserState } from 'fzi-iota-showcase-user-client';
import { TripStarter } from './tripStarter';
import { getNextId } from './idSupplier';
import { enableLogging } from './logger';
import {
  ScheduleDescription,
  ScheduleHandler,
} from 'fzi-iota-showcase-tram-mock';

export class Controller {
  public readonly env: EnvironmentInfo;
  private vehicles = new Map<
    Trytes,
    { mock: VehicleMock; info: VehicleInfo }
  >();
  private stops = new Map<Trytes, Stop>();
  private tripStarter: TripStarter;

  constructor(
    public readonly events: SafeEmitter,
    stops: Stop[],
    connections: Connection[],
    vehicleDescriptions: VehicleDescription[],
    private schedules: ScheduleDescription[],
    public readonly users: Users,
    provider: string,
    iota: API = composeAPI({
      provider,
      attachToTangle: createAttachToTangle(provider),
    }),
    mockPayments = false,
    mockMessages = false,
  ) {
    stops.forEach((s) => this.stops.set(s.id, s));
    const c = new MockConstructor(
      events,
      this.stops,
      provider,
      iota,
      getNextId,
      mockPayments,
      mockMessages,
    );
    enableLogging(events, (id) => {
      const entity = this.getEntity(id);
      return entity ? this.isUser(entity) : false;
    });
    const vehicles = vehicleDescriptions.map((v) => {
      const { info, mock } = c.construct(v);
      this.vehicles.set(info.id, { info, mock });
      return info;
    });
    this.env = {
      stops,
      connections,
      vehicles,
      users: [],
    };
    this.tripStarter = new TripStarter(connections, events);
  }

  public getEntity(id: Trytes): User | VehicleInfo | undefined {
    const entity = this.users.getById(id) || this.vehicles.get(id);
    return entity ? entity.info : undefined;
  }

  public isUser(info: User | VehicleInfo): info is User {
    return this.users.getById(info.id) !== undefined;
  }

  public getRoutes(
    start: Trytes,
    destination: Trytes,
    types: string[],
  ): RouteInfo[] {
    const r = new Router(this.env.connections, this.env.vehicles);
    return r.getRoutes(start, destination, types);
  }

  public startTrip(
    vehicleInfo: VehicleInfo,
    u: { info: User; state: UserState },
    start: Trytes,
    intermediateStops: Trytes[],
    destination: Trytes,
  ) {
    const v = this.vehicles.get(vehicleInfo.id);
    if (v) {
      // TODO check if user and vehicle are at start stop
      return this.tripStarter.startTrip(
        v,
        u,
        start,
        destination,
        intermediateStops,
      );
    } else {
      return Promise.reject(new Error('Vehicle not found.'));
    }
  }

  public stopTripOnNextStop(vehicleId: Trytes) {
    const v = this.vehicles.get(vehicleId);
    if (v) {
      return v.mock.stopTripAtNextStop();
    } else {
      throw new Error('Vehicle not found');
    }
  }

  public async setup() {
    this.events.on('Login', (login: Login) => {
      const user = this.users.getById(login.id);
      this.env.users.push(user!.info);
    });

    this.events.on('Logout', (logout: Logout) => {
      const user = this.env.users.find((u) => u.id === logout.id);
      const index = this.env.users.indexOf(user!);
      this.env.users.splice(index, 1);
    });

    this.events.on('TripStarted', (event: TripStarted) => {
      const v = this.vehicles.get(event.vehicleId);
      const trip = {
        destination: event.destination,
        user: event.userId,
        vehicle: event.vehicleId,
      };
      if (v) {
        v.info.checkIn = undefined;
        v.info.trip = trip;
      }
      const u = this.users.getById(event.userId);
      if (u) {
        u.info.stop = undefined;
        u.info.trip = trip;
      }
    });

    this.events.on('TripFinished', (event: TripFinished) => {
      const v = this.vehicles.get(event.vehicleId);
      if (v) {
        v.info.trip = undefined;
      }
      const u = this.users.getById(event.userId);
      if (u) {
        u.info.stop = event.destination;
        u.info.trip = undefined;
      }
    });

    this.events.on('PosUpdated', (event: PosUpdated) => {
      const v = this.vehicles.get(event.id);
      if (v) {
        if (v.info.trip) {
          const u = this.users.getById(v.info.trip.user);
          u!.info.position = event.position;
        }
      }
    });

    this.events.on('TransactionIssued', (event: TransactionIssued) => {
      const from =
        this.users.getById(event.from) || this.vehicles.get(event.from);
      if (from) {
        const to = this.users.getById(event.to) || this.vehicles.get(event.to);
        if (to) {
          from.info.balance -= event.amount;
          to.info.balance += event.amount;
        }
      }
    });

    await this.initVehicles();
    return this;
  }

  private async initVehicles(parallelCheckIn = false) {
    log.info('Initializing all vehicles...');
    const vehicles = [];
    for (const { mock: vm, info } of this.vehicles.values()) {
      log.info('Init vehicle %s', info.id);
      const p = Promise.all([
        vm.syncTangle().then(() => vm.checkInAtCurrentStop()),
        vm
          .setupPayments()
          .then((ad: AccountData) => (info.balance = ad.balance)),
      ]);
      if (!parallelCheckIn) {
        await p;
      }
      vehicles.push(p);
    }
    await Promise.all(vehicles);

    log.info('Starting schedules...');
    this.schedules.forEach((s) => {
      const vehicle = Array.from(this.vehicles.values()).find(
        (v) => v.info.name === s.forVehicle,
      );
      if (vehicle) {
        new ScheduleHandler(
          vehicle.mock,
          s,
          this.env.connections,
        ).startSchedule();
      } else {
        log.warn('Vehicle ' + s.forVehicle + ' was not found for schedule.');
      }
    });
    log.info('Vehicles initialized.');
  }
}
