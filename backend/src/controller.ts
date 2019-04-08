import {
  SafeEmitter,
  Login,
  Logout,
  TripStarted,
  TripFinished,
  PosUpdated,
} from './events';
import { EnvironmentInfo, Stop, Connection, User } from './envInfo';
import { Users } from './users';
import { VehicleDescription } from './vehicleImporter';
import { Trytes } from '@iota/core/typings/types';
import { API, composeAPI, AccountData } from '@iota/core';
import { VehicleInfo } from './vehicleInfo';
import { createAttachToTangle, log } from 'fzi-iota-showcase-client';
import { VehicleMock, Router, Type } from 'fzi-iota-showcase-vehicle-mock';
import { MockConstructor } from './mockConstructor';

export class Controller {
  public readonly env: EnvironmentInfo;
  private vehicles = new Map<
    Trytes,
    { mock: VehicleMock; info: VehicleInfo }
  >();
  private stops = new Map<Trytes, Stop>();

  constructor(
    public readonly events: SafeEmitter,
    stops: Stop[],
    connections: Connection[],
    vehicleDescriptions: VehicleDescription[],
    public readonly users: Users,
    provider: string,
    iota: API = composeAPI({
      provider,
      attachToTangle: createAttachToTangle(),
    }),
  ) {
    stops.forEach((s) => this.stops.set(s.id, s));
    const c = new MockConstructor(events, this.stops, provider, iota);
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
  }

  public getRoutes(start: Trytes, destination: Trytes) {
    const r = new Router(this.env.connections);
    // TODO
    return r.getRoutes(start, destination, 'tram');
  }

  public startTrip(
    vehicleInfo: VehicleInfo,
    user: User,
    start: Trytes,
    destination: Trytes,
  ) {
    const v = this.vehicles.get(vehicleInfo.id);
    if (v) {
      const r = new Router(this.env.connections);
      const [route] = r.getRoutes(start, destination, v.info.info.type as Type);
      v.mock
        .startTrip(route)
        .then(() =>
          this.events.emit('TripFinished', {
            vehicleId: vehicleInfo.id,
            userId: user.id,
            destination,
          }),
        )
        .then(() => v.mock.checkInAtCurrentStop());
      this.events.emit('TripStarted', {
        vehicleId: vehicleInfo.id,
        userId: user.id,
        start,
        destination,
      });
    }
  }

  public async setup() {
    this.events.on('Login', (login: Login) => {
      const user = this.users.getById(login.id);
      this.env.users.push(user!);
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
        u.stop = undefined;
        u.trip = trip;
      }
    });

    this.events.on('TripFinished', (event: TripFinished) => {
      const v = this.vehicles.get(event.vehicleId);
      if (v) {
        v.info.trip = undefined;
      }
      const u = this.users.getById(event.userId);
      if (u) {
        u.stop = event.destination;
        u.trip = undefined;
      }
    });

    this.events.on('PosUpdated', (event: PosUpdated) => {
      const v = this.vehicles.get(event.id);
      if (v) {
        if (v.info.trip) {
          const u = this.users.getById(v.info.trip.user);
          u!.position = event.position;
        }
      }
    });

    await this.initVehicles();
    return this;
  }

  private async initVehicles() {
    log.info('Initializing all vehicles...');
    await Promise.all(
      Array.from(this.vehicles.values()).map(({ mock: vm, info }) =>
        (async () => {
          log.info('Init vehicle %s', info.id);
          await Promise.all([
            vm.syncTangle().then(() => vm.checkInAtCurrentStop()),
            vm
              .setupPayments()
              .then((ad: AccountData) => (info.balance = ad.balance)),
          ]);
        })(),
      ),
    );
  }
}
