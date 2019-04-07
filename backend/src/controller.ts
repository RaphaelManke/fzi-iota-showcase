import { SafeEmitter, Login, Logout } from './events';
import { EnvironmentInfo, Stop, Connection } from './envInfo';
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

  public startTrip(vehicleId: Trytes, start: Trytes, destination: Trytes) {
    const v = this.vehicles.get(vehicleId);
    if (v) {
      const r = new Router(this.env.connections);
      const [route] = r.getRoutes(start, destination, v.info.info.type as Type);
      v.mock.startTrip(route).then(() => v.mock.checkInAtCurrentStop());
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
