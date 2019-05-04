import {
  PaymentChannel,
  Reservation,
  DestinationMessage,
  OpenPaymentChannelMessage,
  DepositSentMessage,
  TransactionCreatedMessage,
  CreatedNewBranchMessage,
  CancelBoardingMessage,
  log,
  TransactionSignedMessage,
  PaymentChannelState,
} from 'fzi-iota-showcase-client';
import { Trytes, Hash, Bundle } from '@iota/core/typings/types';
import Kerl from '@iota/kerl';
import { trits, trytes } from '@iota/converter';

export class BoardingHandler {
  public static MINIMUM_METERS_PAID = 100;

  private state = State.TRIP_REQUESTED;
  private price?: number;
  private destination?: Trytes;
  private paid = 0;
  private creditsLeft = 0;
  private distanceLeft?: number;
  private branchWaiter?: (digests: any[]) => void;
  private userAddress?: Hash;

  constructor(
    private nonce: Trytes,
    private reservations: Reservation[],
    private settlementAddress: Hash,
    private pricePerMeter: number,
    private speed: number,
    private getPriceAndDistance: (
      destination: Trytes,
    ) => { price: number; distance: number },
    private depositor: (value: number, address: Hash) => Promise<Hash>,
    private txReader: (bundleHash: Hash) => Promise<Bundle>,
    private paymentChannel: PaymentChannel<any, any, any>,
    private sender: Sender,
  ) {}

  public onTripRequested() {
    log.silly('User requested trip');
    this.state = State.VEHICLE_AUTHENTICATED;
    this.sender.authenticate(this.nonce, this.reservations.length > 0);
  }

  public onDestination(message: DestinationMessage) {
    log.silly('User sent destination %O', message);
    let auth = true;
    if (this.reservations.length > 0) {
      if (!message.nonce) {
        auth = false;
        this.sender.cancelBoarding('Reservation nonce must be provided.');
      } else {
        const hashed = hash(message.nonce);
        const res = this.reservations.find((r) => r.hashedNonce === hashed);
        if (!res) {
          auth = false;
          this.sender.cancelBoarding('Reservation nonce must be provided.');
        }
      }
    }
    if (auth) {
      this.state = State.ROUTE_PRICED;
      this.updateDestination(message.destStop);
    }
  }

  public async updateDestination(destination: Trytes) {
    const { price, distance } = this.getPriceAndDistance(destination);
    this.price = price;

    if (this.destination && this.distanceLeft) {
      const { distance: oldDistance } = this.getPriceAndDistance(
        this.destination,
      );
      this.destination = destination;
      const delta = distance - oldDistance;
      this.distanceLeft += delta;
      log.debug(
        'Vehicle destination stop updated. %s m left to drive. Total price: %s.',
        this.distanceLeft,
        this.price,
      );

      if (this.paid > this.price) {
        await this.sendTransaction(this.paid - this.price);
      }
      this.sender.priced(this.price);
    } else {
      this.destination = destination;
      this.distanceLeft = distance;
      this.state = State.ROUTE_PRICED;
      this.sender.priced(this.price);
    }
  }

  public async onPaymentChannelOpened(message: OpenPaymentChannelMessage) {
    log.silly('User opened payment channel %O', message);
    this.paymentChannel.open(
      this.settlementAddress,
      1,
      generateSeed(),
      2,
      message.depth,
      message.security,
    );
    this.userAddress = message.settlement;
    const digests = this.paymentChannel.createDigests();
    await this.paymentChannel.prepareChannel(
      [message.digests, digests],
      [message.settlement, this.settlementAddress],
    );
    this.state = State.PAYMENT_CHANNEL_OPENED;
    this.sender.openPaymentChannel(
      1,
      this.settlementAddress,
      message.depth,
      message.security,
      digests,
    );
  }

  public async onDepositSent(message: DepositSentMessage) {
    log.silly('User sent depsoit %O', message);
    if (this.state === State.PAYMENT_CHANNEL_OPENED) {
      try {
        const txs = await this.txReader(message.depositTransaction);
        const tx = txs.find((t) => t.address === this.paymentChannel.rootAddress);
        if (tx) {
          if (tx.value === this.price) {
            try {
              const bundleHash = await this.depositor(
                this.price!,
                this.paymentChannel.rootAddress,
              );
              this.paymentChannel.updateDeposit([this.price, tx.value]);
              this.state = State.READY_FOR_PAYMENT;
              this.sender.depositSent(
                bundleHash,
                this.price!,
                this.paymentChannel.rootAddress,
              );
            } catch (e) {
              this.state = State.CLOSED;
              log.error('Vehicle failed sending deposit. %s', e);
              this.sender.cancelBoarding('Could not send deposit.');
            }
          } else {
            this.state = State.CLOSED;
            this.sender.cancelBoarding(
              `Transaction should have amount ${this.price} but has ${tx.value}`,
            );
          }
        }
      } catch (e) {
        this.state = State.CLOSED;
        log.error('Vehicle failed reading deposit tx. %s', e);
        this.sender.cancelBoarding('Could not read deposit.');
      }
    } else {
      const state = this.state;
      this.state = State.CLOSED;
      throw new Error(
        `State must be 'PAYMENT_CHANNEL_OPENED' but is '${State[state]}'`,
      );
    }
  }

  public addMetersDriven(add: number) {
    this.creditsLeft -= this.pricePerMeter * add;
    const distancePaidLeft = this.creditsLeft / this.pricePerMeter;
    this.distanceLeft! -= add; // distance left to drive
    if (
      this.state !== State.CLOSED &&
      this.distanceLeft &&
      this.distanceLeft > 0
    ) {
      const minimumCredits =
        this.pricePerMeter * BoardingHandler.MINIMUM_METERS_PAID;
      if (
        this.creditsLeft <= minimumCredits &&
        distancePaidLeft < this.distanceLeft
      ) {
        log.warn(
          'User paid for %s more meters but distance to destination is %s meters.',
          distancePaidLeft,
          this.distanceLeft,
        );
        const amount = Math.min(
          minimumCredits,
          this.pricePerMeter * this.distanceLeft,
        );
        this.sender.creditsExausted(amount);
      } else {
        this.sender.creditsLeft(
          this.creditsLeft,
          distancePaidLeft,
          (distancePaidLeft * 1000) / this.speed,
        );
      }
    }
  }

  public async onTransactionReceived(message: TransactionCreatedMessage) {
    log.silly('User sent transaction %O', message);
    if (this.state === State.READY_FOR_PAYMENT) {
      const signedBundles = this.paymentChannel.signTransaction(
        message.bundles,
        message.signedBundles,
      );
      this.paymentChannel.applyTransaction(signedBundles);
      if (!message.close) {
        const transfers = this.paymentChannel.extractTransfers(
          message.bundles,
          1,
        );
        const tx = transfers.find(
          (t: { value: number; address: Hash }) =>
            t.value > 0 && t.address === this.settlementAddress,
        );
        if (tx) {
          this.sender.signedTransaction(signedBundles, tx.value, message.close);
          this.creditsLeft += tx.value;
          this.paid += tx.value;
          const distanceLeft = this.creditsLeft / this.pricePerMeter;
          this.sender.creditsLeft(
            this.creditsLeft,
            distanceLeft,
            (distanceLeft * 1000) / this.speed,
          );
        } else {
          log.warn('No value transaction was found in bundle');
          this.state = State.CLOSED;
        }
      } else {
        let tailTransactionHash = '';
        try {
          tailTransactionHash = await this.paymentChannel.attachCurrentBundle();
        } catch (e) {
          log.error('Vehicle failed attaching closing tx. ' + (e.message || e));
        }
        this.sender.closePaymentChannel(tailTransactionHash);
        this.state = State.CLOSED;
      }
    } else {
      log.warn(`State must be 'READY_FOR_PAYMENT' but is ${State[this.state]}`);
      this.state = State.CLOSED;
    }
  }

  public onSignedTransaction(message: TransactionSignedMessage) {
    log.silly('User signed transaction %O', message);
    if (this.state === State.AWAIT_SIGNING) {
      this.paymentChannel.applyTransaction(message.signedBundles);
      this.state = State.READY_FOR_PAYMENT;
    }
  }

  public onCreatedNewBranch(message: CreatedNewBranchMessage) {
    log.silly('User created new branch %O', message);
    if (this.state === State.READY_FOR_PAYMENT) {
      if (!this.branchWaiter) {
        // creation not issued by me
        const myDigests = this.paymentChannel.createDigests(
          message.digests.length,
        );
        this.paymentChannel.buildNewBranch(
          [message.digests, myDigests],
          message.multisig,
        );
      } else {
        this.branchWaiter(message.digests);
        this.branchWaiter = undefined;
      }
    }
  }

  public onBoardingCanceled(message: CancelBoardingMessage) {
    log.debug('User cancelled boarding %O', message);
    this.paymentChannel.state = PaymentChannelState.CLOSED;
    if (this.state !== State.CLOSED) {
      this.state = State.CLOSED;
      const reason = message.reason
        ? 'User ' +
          message.reason[0].toLowerCase() +
          message.reason.substring(1)
        : 'User cancelled boarding';
      this.sender.cancelBoarding(reason);
    }
  }

  private async createNewBranch(multisig: any, generate: number) {
    const digests = this.paymentChannel.createDigests(generate);
    this.state = State.AWAIT_NEW_BRANCH;
    return new Promise<void>((res, rej) => {
      this.branchWaiter = (otherDigests) => {
        this.paymentChannel.buildNewBranch([digests, otherDigests], multisig);
        this.state = State.READY_FOR_PAYMENT;
        res();
      };
      this.sender.createdNewBranch(digests, multisig);
    });
  }

  private async sendTransaction(amount: number) {
    if (this.state === State.READY_FOR_PAYMENT) {
      const {
        bundles,
        signedBundles,
      } = await this.paymentChannel.createTransaction(
        amount,
        this.userAddress!,
        this.createNewBranch,
      );
      this.paid -= amount;
      this.creditsLeft -= amount;
      this.addMetersDriven(0);
      this.state = State.AWAIT_SIGNING;
      this.sender.createdTransaction(bundles, signedBundles, false);
    } else {
      log.warn(
        `Vehicle wants to make payment but state is ${State[this.state]}`,
      );
    }
  }
}

function generateSeed(length = 81) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ9';
  const retVal = [];
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal[i] = charset.charAt(Math.floor(Math.random() * n));
  }
  const result = retVal.join('');
  return result;
}

function hash(value: Trytes) {
  const kerl = new Kerl();
  kerl.initialize();
  const input = trits(value);
  kerl.absorb(input, 0, input.length);
  const result = new Int8Array(243);
  kerl.squeeze(result, 0, input.length);
  return trytes(result);
}

export interface Sender {
  authenticate(nonce: Trytes, sendAuth: boolean): void;

  cancelBoarding(reason?: string): void;

  priced(price: number): void;

  openPaymentChannel(
    userIndex: number,
    settlement: Hash,
    depth: number,
    security: number,
    digest: any[],
  ): void;

  depositSent(hash: Hash, amount: number, address: Hash): void;

  createdNewBranch(digest: any[], multisig: any): void;

  signedTransaction(signedBundles: any[], value: number, close: boolean): void;

  createdTransaction(bundles: any, signedBundles: any, close: boolean): void;

  creditsLeft(amount: number, distance: number, millis: number): void;

  creditsExausted(minimumAmount: number): void;

  closePaymentChannel(tailTransactionHash: Hash): void;
}

export enum State {
  TRIP_REQUESTED,
  VEHICLE_AUTHENTICATED,
  ROUTE_PRICED,
  PAYMENT_CHANNEL_OPENED,
  READY_FOR_PAYMENT,
  AWAIT_SIGNING,
  AWAIT_NEW_BRANCH,
  CLOSED,
}
