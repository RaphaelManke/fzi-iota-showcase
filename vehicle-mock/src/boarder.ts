import { Exception, log, FlashMock } from 'fzi-iota-showcase-client';
import { getDistance, getPathLength } from 'geolib';
import { BoardingHandler, Sender } from 'fzi-iota-showcase-vehicle-client';
import { Trytes, Hash, Bundle } from '@iota/core/typings/types';
import { Observer } from './observer';
import { Vehicle } from './vehicle';
import { Path, PathFinder, Connection } from './pathFinder';
import { API } from '@iota/core';

export class Boarder {
  public get handler() {
    return this.h!;
  }

  public get start() {
    return this.path.connections[0].from;
  }

  public get destination() {
    return this.path.connections[this.path.connections.length - 1].to;
  }
  private h?: BoardingHandler;
  private observer?: Partial<Observer>;

  constructor(
    private readonly vehicle: Vehicle,
    public readonly userId: Trytes,
    private readonly settlementAddress: Hash,
    private path: Path,
    private readonly pricePerMeter: number,
    private readonly onTripFinished: (stop: Trytes) => void,
  ) {}

  public onStartDriving() {
    const { price } = this.getPriceDistanceCalculator()(this.destination);
    // send event
    this.vehicle.tripStarted(this.userId, this.destination, price);
  }

  public startBoarding(
    sendToUser: Sender,
    depositor: (value: number, address: Hash) => Promise<string>,
    mockPayments: boolean,
    iota: API,
    setSentVehicleHandler: (handler: BoardingHandler) => void,
    onClosingTransaction: (address: Hash, value: number) => void,
  ): Promise<void> {
    return new Promise<void>((res, rej) => {
      try {
        const flash = new FlashMock(mockPayments ? undefined : iota);
        // observe sender
        const senderProxy = this.createSenderProxy(
          sendToUser,
          this.userId,
          () =>
            onClosingTransaction(
              this.settlementAddress,
              flash.balances.get(this.settlementAddress!) || 0,
            ),
          res,
          rej,
        );

        const { price } = this.getPriceDistanceCalculator()(this.destination);
        // use real or mocked payment functions
        let txReader: (bundleHash: Hash) => Promise<Bundle>;
        if (mockPayments) {
          txReader = async () => this.mockedBundle(price, flash.rootAddress);
        } else {
          txReader = async (tailTransactionHash) =>
            await iota.getBundle(tailTransactionHash);
        }

        this.h = new BoardingHandler(
          this.vehicle.trip!.nonce,
          this.vehicle.trip!.reservations,
          this.settlementAddress,
          this.pricePerMeter,
          this.vehicle.info.speed,
          this.getPriceDistanceCalculator(),
          depositor,
          txReader,
          flash,
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

  public updateDestination(stop: Trytes) {
    this.path = getPath(this.path.connections, stop, this.vehicle.info.type);
    this.handler.updateDestination(stop);
  }

  public tripFinished(stop: Trytes) {
    this.onTripFinished(stop);
    if (this.observer) {
      this.vehicle.removeObserver(this.observer);
    }
  }

  private mockedBundle(price: number, address: Hash): Bundle {
    return [
      {
        address,
        value: price,
        attachmentTimestamp: 0,
        attachmentTimestampLowerBound: 0,
        attachmentTimestampUpperBound: 0,
        branchTransaction: '',
        bundle: '',
        confirmed: true,
        currentIndex: 0,
        hash: '',
        lastIndex: 0,
        nonce: '',
        obsoleteTag: '',
        signatureMessageFragment: '',
        tag: '',
        timestamp: 0,
        trunkTransaction: '',
      },
    ];
  }

  private getPriceDistanceCalculator() {
    const self = this;
    const type = this.vehicle.info.type;
    const pricePerMeter = this.pricePerMeter;
    return (dest: Trytes) => {
      const route = getPath(self.path.connections, dest, type);
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
    onClosingTransaction: (tailTransactionHash: Hash) => void,
    res: () => void,
    rej: (reason: any) => void,
  ): Sender {
    let boardingFinished = false;
    const self = this;
    // const vehicle = this.vehicle;
    // const path = this.path;
    // const destination = this.destination;

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
      depositSent(hash, amount, address) {
        sendToUser.depositSent(hash, amount, address);
      },
      signedTransaction(signedBundles, value, close) {
        if (!close) {
          self.vehicle.transactionReceived(userId, value);
        }
        sendToUser.signedTransaction(signedBundles, value, close);
      },
      creditsLeft(amount, distanceLeft, millis) {
        if (!boardingFinished && amount > 0) {
          // ready to start driving
          boardingFinished = true;
          if (!self.vehicle.trip!.destination) {
            // only if vehicle did not set path itself
            self.vehicle.trip!.destination = self.destination;
            self.vehicle.trip!.path = self.path;
          }
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
      closePaymentChannel(tailTransactionHash) {
        onClosingTransaction(tailTransactionHash);
        sendToUser.closePaymentChannel(tailTransactionHash);
      },
      cancelBoarding(reason) {
        sendToUser.cancelBoarding(reason);
        if (self.observer) {
          self.vehicle.removeObserver(self.observer);
        }
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

function getPath(connections: Connection[], dest: Trytes, type: string) {
  let i = 0;
  const cons = [];
  do {
    cons.push(connections[i++]);
  } while (cons[cons.length - 1].to !== dest);
  const p = new PathFinder(cons);
  const [route] = p.getPaths(connections[0].from, dest, [type]);
  return route;
}
