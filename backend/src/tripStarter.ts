import { Connection, User } from './envInfo';
import { Trytes } from '@iota/core/typings/types';
import { VehicleInfo } from './vehicleInfo';
import { Exception, CheckInMessage } from 'fzi-iota-showcase-client';
import {
  UserState,
  Sender as UserSender,
  TripHandler,
} from 'fzi-iota-showcase-user-client';
import {
  Sender as VehicleSender,
  BoardingHandler,
} from 'fzi-iota-showcase-vehicle-client';
import { VehicleMock, PathFinder } from 'fzi-iota-showcase-vehicle-mock';
import { SafeEmitter } from './events';
import { getPathLength } from 'geolib';

export class TripStarter {
  constructor(private connections: Connection[], private events: SafeEmitter) {}

  public startTrip(
    v: { info: VehicleInfo; mock: VehicleMock },
    { info: user, state: userState }: { info: User; state: UserState },
    start: Trytes,
    destination: Trytes,
    intermediateStops: Trytes[],
  ): Promise<any> {
    const connections = this.findConnections(
      start,
      destination,
      intermediateStops,
      v.info.info.type,
    );
    const r = new PathFinder(connections);
    const [route] = r.getPaths(start, destination, [v.info.info.type]);

    const { sender, setter } = this.createUserSender(v.mock, user.id);
    const distance = getPathLength(
      route.waypoints.map((pos) => ({ latitude: pos.lat, longitude: pos.lng })),
    );

    const destAllowed = ({ vehicleInfo }: CheckInMessage) =>
      !vehicleInfo ||
      !vehicleInfo.allowedDestinations ||
      vehicleInfo.allowedDestinations.length === 0 ||
      vehicleInfo.allowedDestinations.find((s: Trytes) => s === destination) !==
        undefined;

    const checkIn = v.info.checkIns.find(
      ({ message, stop }) => stop === start && destAllowed(message),
    )!;
    const maxPrice = distance * checkIn.message.price;
    const tripHandler = userState.createTripHandler(
      destination,
      checkIn.message,
      maxPrice,
      (distance * 1000) / v.info.info.speed,
      sender,
    );

    const vehicleSender = this.createVehicleSender(tripHandler);

    this.events.emit('BoardingStarted', {
      userId: user.id,
      vehicleId: v.info.id,
      destination,
    });
    return v.mock
      .startBoarding(route, vehicleSender, user.id, setter, (stop: Trytes) => {
        this.events.emit('TripFinished', {
          vehicleId: v.info.id,
          userId: user.id,
          destination: stop,
        });
      })
      .catch((e: any) =>
        Promise.reject(
          new Exception('Starting trip failed. ' + (e.message || e), e),
        ),
      );
  }

  private findConnections(
    start: Trytes,
    destination: Trytes,
    intermediateStops: Trytes[],
    type: string,
  ) {
    const forType = this.connections.filter((c) => c.type === type);
    forType.push(
      ...forType.map(
        (c): Connection => ({
          from: c.to,
          to: c.from,
          path: Array.from(c.path).reverse(),
          type: c.type,
        }),
      ),
    );
    const connections: Connection[] = [];
    const stops = [start, ...intermediateStops, destination];
    for (let i = 0; i < stops.length - 1; i++) {
      const from = stops[i];
      const to = stops[i + 1];
      const found = forType.find((c) => c.from === from && c.to === to);
      if (found) {
        connections.push(found);
      } else {
        throw new Error('No connection from ' + from + ' to ' + to + ' found');
      }
    }
    return connections;
  }

  private createUserSender(
    mock: VehicleMock,
    userId: Trytes,
  ): {
    sender: UserSender;
    setter: (handler: BoardingHandler) => void;
  } {
    let boardingHandler: BoardingHandler;
    const sender: UserSender = {
      openPaymentChannel(userIndex, settlement, depth, security, digests) {
        boardingHandler.onPaymentChannelOpened({
          userIndex,
          settlement,
          depth,
          security,
          digests,
        });
      },
      sendDestination(destStop, nonce) {
        boardingHandler.onDestination({ destStop, nonce });
      },
      depositSent(hash, amount) {
        boardingHandler.onDepositSent({ depositTransaction: hash, amount });
      },
      createdTransaction(bundles, signedBundles, close) {
        boardingHandler.onTransactionReceived({
          bundles,
          signedBundles,
          close,
        });
      },
      createdNewBranch(digests, multisig) {
        boardingHandler.onCreatedNewBranch({ digests, multisig });
      },
      signedTransaction(signedBundles, value, close) {
        if (!close) {
          mock.emitTransactionSent(userId, value);
        }
        boardingHandler.onSignedTransaction({ signedBundles, value, close });
      },
      cancelBoarding(reason) {
        boardingHandler.onBoardingCanceled({ reason });
      },
    };
    return {
      sender,
      setter: (handler: BoardingHandler) => (boardingHandler = handler),
    };
  }

  private createVehicleSender(tripHandler: TripHandler): VehicleSender {
    return {
      authenticate(nonce, sendAuth) {
        tripHandler.onVehicleAuthentication({ nonce, sendAuth });
      },
      cancelBoarding(reason) {
        tripHandler.onBoardingCanceled({ reason });
      },
      closePaymentChannel(bundleHash) {
        tripHandler.onClosedPaymentChannel({ bundleHash });
      },
      creditsExausted(minimumAmount) {
        tripHandler.onCreditsExausted({ minimumAmount });
      },
      creditsLeft(amount, distance, millis) {
        tripHandler.onCreditsLeft({ amount, distance, millis });
      },
      depositSent(hash, amount) {
        tripHandler.onDepositSent({ amount, depositTransaction: hash });
      },
      openPaymentChannel(userIndex, settlement, depth, security, digests) {
        tripHandler.onPaymentChannelOpened({
          userIndex,
          settlement,
          depth,
          security,
          digests,
        });
      },
      priced(price) {
        tripHandler.onPriceSent({ price });
      },
      signedTransaction(signedBundles, value, close) {
        tripHandler.onSignedTransaction({ signedBundles, value, close });
      },
      createdNewBranch(digests, multisig) {
        tripHandler.onCreatedNewBranch({ digests, multisig });
      },
      createdTransaction(bundles, signedBundles, close) {
        tripHandler.onTransactionReceived({ bundles, signedBundles, close });
      },
    };
  }
}
