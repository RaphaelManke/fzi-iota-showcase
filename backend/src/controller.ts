import {
  SafeEmitter,
  Login,
  Logout,
  TripStarted,
  TripFinished,
  PosUpdated,
  PaymentIssued,
  Departed,
  BoardingCancelled,
} from './events';
import { EnvironmentInfo, Stop, Connection, User, Trip } from './envInfo';
import { Users } from './users';
import { VehicleDescription } from './vehicleImporter';
import { Trytes, Transfer, Hash } from '@iota/core/typings/types';
import { API, composeAPI } from '@iota/core';
import { VehicleInfo } from './vehicleInfo';
import {
  createAttachToTangle,
  log,
  CheckInMessage,
} from 'fzi-iota-showcase-client';
import { VehicleMock } from 'fzi-iota-showcase-vehicle-mock';
import { MockConstructor } from './mockConstructor';
import { RouteInfo } from './routeInfo';
import { Router } from './router';
import { TripStarter } from './tripStarter';
import { getNextId } from './idSupplier';
import { enableLogging } from './logger';
import {
  ScheduleDescription,
  ScheduleHandler,
} from 'fzi-iota-showcase-tram-mock';
import * as retry from 'bluebird-retry';
import { UserMock } from './userMock';

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
    private iota: API = composeAPI({
      provider,
      attachToTangle: createAttachToTangle(provider),
    }),
    private mwm: number,
    private mockPayments = false,
    mockMessages = false,
    private masterSeed?: Hash,
  ) {
    stops.forEach((s) => this.stops.set(s.id, s));
    const c = new MockConstructor(
      events,
      this.stops,
      provider,
      iota,
      mwm,
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
    u: { info: User; state: UserMock },
    start: Trytes,
    intermediateStops: Trytes[],
    destination: Trytes,
  ) {
    const v = this.vehicles.get(vehicleInfo.id);
    if (v) {
      if (
        v.info.checkIns.find(
          ({ message, stop }) =>
            stop === start && this.destAllowed(message, destination),
        )
      ) {
        if (v.info.stop === start) {
          if (u.info.stop === start) {
            if (!u.state.isOnTrip) {
              return this.tripStarter
                .startTrip(v, u, start, destination, intermediateStops)
                .catch((reason) => {
                  const prefix = 'Starting trip failed. Boarding cancelled. ';
                  let reasonMessage: string = reason.message || reason;
                  const index = reasonMessage.indexOf(prefix);
                  if (index !== -1) {
                    reasonMessage = reasonMessage.substring(
                      index + prefix.length,
                    );
                  }

                  this.events.emit('BoardingCancelled', {
                    userId: u.info.id,
                    vehicleId: v.info.id,
                    reason: reasonMessage,
                  });
                  return Promise.reject(reason);
                });
            } else {
              return Promise.reject(
                new Error('User has requested another trip.'),
              );
            }
          } else {
            return Promise.reject(new Error('User isn\'t at start stop.'));
          }
        } else {
          return Promise.reject(
            new Error('Vehicle isn\'t checked in at start stop.'),
          );
        }
      } else {
        return Promise.reject(new Error('Destination is not allowed.'));
      }
    } else {
      return Promise.reject(new Error('Vehicle not found.'));
    }
  }

  public stopTripOnNextStop(vehicleId: Trytes, userId: Trytes) {
    const v = this.vehicles.get(vehicleId);
    if (v) {
      return v.mock.stopTripAtNextStop(userId);
    } else {
      throw new Error('Vehicle not found');
    }
  }

  public setup() {
    this.events.on('Login', (login: Login) => {
      const user = this.users.getById(login.id);
      this.env.users.push(user!.info);
    });

    this.events.on('Logout', (logout: Logout) => {
      const user = this.env.users.find((u) => u.id === logout.id);
      const index = this.env.users.indexOf(user!);
      this.env.users.splice(index, 1);
    });

    this.events.on('Departed', (event: Departed) => {
      const v = this.vehicles.get(event.vehicleId);
      if (v) {
        const index = v.info.checkIns.findIndex(
          ({ message, stop }) =>
            stop === event.stop && this.destAllowed(message, event.destination),
        );
        if (index !== -1) {
          // remove checkIn for this stop when departed.
          v.info.checkIns.splice(index, 1);
        }
      }
    });

    this.events.on('TripStarted', (event: TripStarted) => {
      const v = this.vehicles.get(event.vehicleId);
      const trip: Trip = {
        destination: event.destination,
        userId: event.userId,
        vehicleId: event.vehicleId,
      };
      if (v) {
        v.info.trips.push(trip);
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
        const index = v.info.trips.findIndex((t) => t.userId === event.userId);
        if (index !== -1) {
          v.info.trips.splice(index, 1);
        }
      }
      const u = this.users.getById(event.userId);
      if (u) {
        u.info.stop = event.destination;
        u.info.trip = undefined;
        u.state.isOnTrip = false;
      }
    });

    this.events.on('BoardingCancelled', (event: BoardingCancelled) => {
      const u = this.users.getById(event.userId);
      if (u) {
        u.state.isOnTrip = false;
      }
    });

    this.events.on('PosUpdated', (event: PosUpdated) => {
      const v = this.vehicles.get(event.id);
      if (v) {
        v.info.trips
          .map((t) => this.users.getById(t.userId))
          .filter((u) => u !== undefined)
          .forEach((u) => (u!.info.position = event.position));
      }
    });

    this.events.on('PaymentIssued', (event: PaymentIssued) => {
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

    return this;
  }

  public async initVehicles(parallelInit = true, fundAmount = 1000000000) {
    log.info('Initializing all vehicles...');
    const promises = [];
    for (const { mock: vm, info } of this.vehicles.values()) {
      log.info('Init vehicle %s', info.id);
      const p = Promise.all([
        retry(vm.syncTangle, { context: vm }),
        retry(() => vm.setupPayments().then((ad) => (info.balance = ad.balance))),
      ])
        .then(() =>
          retry(() => {
            // TODO switch this to AUTO_CHECK_IN
            if (info.info.driveStartingPolicy !== 'MANUAL') {
              vm.checkInAtCurrentStop();
            }
          }),
        )
        .catch((reason) => {
          log.error(
            'Init vehicle %s failed. ' +
              (reason.message || reason) +
              '. Vehicle will be removed.',
            info.id,
          );
          const i = this.env.vehicles.findIndex((v) => v.id === info.id);
          this.env.vehicles.splice(i, 1);
          this.vehicles.delete(info.id);
        });
      if (!parallelInit) {
        await p;
      }
      promises.push(p);
    }
    await Promise.all(promises);

    if (!this.mockPayments && this.masterSeed) {
      log.info('Transfering funds to vehicles...');
      const toFund = Array.from(this.vehicles.values()).filter(
        ({ info }) => info.balance === 0, // only include empty accounts -> random generated seed
      );

      const transfers: Transfer[] = toFund.map(
        ({ mock: { address } }): Transfer => ({
          address: address!,
          value: fundAmount,
        }),
      );
      await retry(() =>
        this.iota
          .prepareTransfers(this.masterSeed!, transfers)
          .then((trytes) => this.iota.sendTrytes(trytes, 3, this.mwm))
          .then(() => toFund.forEach(({ info }) => (info.balance = fundAmount))),
      );
    }

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

  private destAllowed = (
    { vehicleInfo }: CheckInMessage,
    destination: Trytes,
  ) =>
    !vehicleInfo ||
    !vehicleInfo.allowedDestinations ||
    vehicleInfo.allowedDestinations.length === 0 ||
    vehicleInfo.allowedDestinations.find((s: Trytes) => s === destination) !==
      undefined
}
