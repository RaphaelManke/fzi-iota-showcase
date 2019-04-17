import { Exception, log, FlashMock } from 'fzi-iota-showcase-client';
import { getDistance, getPathLength } from 'geolib';
import { BoardingHandler, Sender } from 'fzi-iota-showcase-vehicle-client';
import { Trytes, Hash, Bundle } from '@iota/core/typings/types';
import { Observer } from './observer';
import { Vehicle } from './vehicle';
import { Path, PathFinder } from './pathFinder';

export class Boarder {
  private h?: BoardingHandler;
  private observer?: Partial<Observer>;

  constructor(
    private vehicle: Vehicle,
    private userId: Trytes,
    private settlementAddress: Hash,
    private path: Path,
    private pricePerMeter: number,
  ) {}

  public get handler() {
    return this.h!;
  }

  private get destination() {
    return this.path.connections[this.path.connections.length - 1].to;
  }

  public onStartDriving() {
    const { price } = this.getPriceDistanceCalculator()(this.destination);
    // send event
    this.vehicle.tripStarted(
      this.userId,
      this.path.connections[this.path.connections.length - 1].to,
      price,
    );
  }

  public startBoarding(
    sendToUser: Sender,
    depositor: (value: number, address: Hash) => Promise<string>,
    txReader: (bundleHash: Hash) => Promise<Bundle>,
    setSentVehicleHandler: (handler: BoardingHandler) => void,
  ): Promise<void> {
    return new Promise<void>((res, rej) => {
      try {
        // observe sender
        const senderProxy = this.createSenderProxy(
          sendToUser,
          this.userId,
          res,
          rej,
        );

        this.h = new BoardingHandler(
          this.vehicle.trip!.nonce,
          this.vehicle.trip!.reservations,
          this.settlementAddress,
          this.pricePerMeter,
          this.vehicle.info.speed,
          this.getPriceDistanceCalculator(),
          depositor,
          txReader,
          new FlashMock(),
          senderProxy,
        );
        setSentVehicleHandler(this.handler);

        // create observer to notify boarding handler when vehicle moved
        let lastPosition = this.vehicle.position;
        const handler = this.handler!;
        this.observer = {
          posUpdated(position) {
            const add = getDistance(
              { latitude: lastPosition.lat, longitude: lastPosition.lng },
              { latitude: position.lat, longitude: position.lng },
            );
            lastPosition = position;
            handler.addMetersDriven(add);
          },
        };
        this.vehicle.addObserver(this.observer);

        // start boarding
        this.handler.onTripRequested();
      } catch (e) {
        log.error('Boarding failed ', e);
        rej(new Exception('Boarding failed', e));
      }
    });
  }

  public cleanUp() {
    if (this.observer) {
      this.vehicle.removeObserver(this.observer);
    }
  }

  private getPriceDistanceCalculator() {
    const path = this.path;
    const type = this.vehicle.info.type;
    const pricePerMeter = this.pricePerMeter;
    return (dest: Trytes) => {
      let i = 0;
      const cons = [];
      do {
        cons.push(path.connections[i++]);
      } while (cons[cons.length - 1].to !== dest);
      const p = new PathFinder(cons);
      const [route] = p.getPaths(path.connections[0].from, dest, [type]);
      const dis = getPathLength(
        route.waypoints.map((pos) => ({
          latitude: pos.lat,
          longitude: pos.lng,
        })),
      );
      return { distance: dis, price: dis * pricePerMeter };
    };
  }

  private createSenderProxy(
    sendToUser: Sender,
    userId: Trytes,
    res: () => void,
    rej: (reason: any) => void,
  ): Sender {
    let boardingFinished = false;
    const vehicle = this.vehicle;
    const path = this.path;
    const destination = this.destination;

    return {
      authenticate(nonce, sendAuth) {
        sendToUser.authenticate(nonce, sendAuth);
      },
      priced(price) {
        sendToUser.priced(price);
      },
      openPaymentChannel(...args) {
        sendToUser.openPaymentChannel(...args);
      },
      depositSent(hash, amount) {
        sendToUser.depositSent(hash, amount);
      },
      signedTransaction(signedBundles, value, close) {
        if (!close) {
          vehicle.transactionReceived(userId, value);
        }
        sendToUser.signedTransaction(signedBundles, value, close);
      },
      creditsLeft(amount, distanceLeft, millis) {
        if (!boardingFinished && amount > 0) {
          // ready to start driving
          boardingFinished = true;
          vehicle.trip!.destination = destination;
          vehicle.trip!.path = path;
          res();
        } else {
          // TODO resume driving if stopped
        }
        sendToUser.creditsLeft(amount, distanceLeft, millis);
      },
      creditsExausted(minimumAmount) {
        // TODO stop vehicle
        sendToUser.creditsExausted(minimumAmount);
      },
      closePaymentChannel(bundleHash) {
        sendToUser.closePaymentChannel(bundleHash);
      },
      cancelBoarding(reason) {
        sendToUser.cancelBoarding(reason);
        rej(new Error('Boarding cancelled. ' + reason));
      },
      createdNewBranch(digests, multisig) {
        sendToUser.createdNewBranch(digests, multisig);
      },
      createdTransaction(bundles, signedBundles, close) {
        sendToUser.createdTransaction(bundles, signedBundles, close);
      },
    };
  }
}
