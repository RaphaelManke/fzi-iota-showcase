import {
  PaymentChannel,
  Reservation,
  DestinationMessage,
  OpenPaymentChannelMessage,
  DepositSentMessage,
  TransactionCreatedMessage,
  CreatedNewBranchMessage,
} from 'fzi-iota-showcase-client';
import { Trytes, Hash, Transaction } from '@iota/core/typings/types';
import Kerl from '@iota/kerl';
import { trits, trytes } from '@iota/converter';

export class BoardingHandler {
  public static MINIMUM_METERS_PAID = 100;

  private state = State.TRIP_REQUESTED;
  private price: undefined | number;
  private destination: undefined | Trytes;
  private creditsLeft = 0;
  private distanceLeft: undefined | number;

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
    private txReader: (bundleHash: Hash) => Promise<Transaction>,
    private paymentChannel: PaymentChannel<any, any, any>,
    private sender: Sender,
  ) {}

  public onTripRequested() {
    this.state = State.VEHICLE_AUTHENTICATED;
    this.sender.authenticate(this.nonce, this.reservations.length > 0);
  }

  public onDestination(message: DestinationMessage) {
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
      const { price, distance } = this.getPriceAndDistance(message.destStop);
      this.price = price;
      this.distanceLeft = distance;
      this.destination = message.destStop;
      this.state = State.ROUTE_PRICED;
      this.sender.priced(this.price);
    }
  }

  public onPaymentChannelOpened(message: OpenPaymentChannelMessage) {
    this.paymentChannel.open(
      this.settlementAddress,
      1,
      generateSeed(),
      2,
      message.depth,
      message.security,
    );
    const digests = this.paymentChannel.createDigests();
    this.paymentChannel.prepareChannel(
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
    if (this.state === State.PAYMENT_CHANNEL_OPENED) {
      const tx = await this.txReader(message.depositTransaction);
      if (tx.address === this.paymentChannel.rootAddress) {
        if (tx.value === this.price) {
          const bundleHash = await this.depositor(
            this.price!,
            this.paymentChannel.rootAddress,
          );
          this.paymentChannel.updateDeposit([this.price, tx.value]);
          this.state = State.READY_FOR_PAYMENT;
          this.sender.depositSent(bundleHash, this.price!);
        } else {
          this.state = State.CLOSED;
          this.sender.cancelBoarding('Transaction has false amount');
        }
      }
    } else {
      this.state = State.CLOSED;
      throw new Error(
        `State must be 'PAYMENT_CHANNEL_OPENED' but is '${this.state}'`,
      );
    }
  }

  public addMetersDriven(add: number) {
    this.creditsLeft -= this.pricePerMeter * add;
    this.distanceLeft! -= add;
    if (this.creditsLeft <= 0) {
      this.sender.creditsExausted(
        this.pricePerMeter *
          Math.min(BoardingHandler.MINIMUM_METERS_PAID, this.distanceLeft!),
      );
    } else {
      const distanceLeft = this.creditsLeft / this.pricePerMeter;
      this.sender.creditsLeft(
        this.creditsLeft,
        distanceLeft,
        (distanceLeft * 1000) / this.speed,
      );
    }
  }

  public async onTransactionReceived(message: TransactionCreatedMessage) {
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
          const distanceLeft = this.creditsLeft / this.pricePerMeter;
          this.sender.creditsLeft(
            this.creditsLeft,
            distanceLeft,
            (distanceLeft * 1000) / this.speed,
          );
        } else {
          throw new Error('No value transaction was found in bundle');
        }
      } else {
        const bundleHash = await this.paymentChannel.attachCurrentBundle();
        this.sender.closePaymentChannel(bundleHash);
      }
    } else {
      throw new Error(`State must be 'READY_FOR_PAYMENT' but is ${this.state}`);
    }
  }

  public onCreatedNewBranch(message: CreatedNewBranchMessage) {
    if (this.state === State.READY_FOR_PAYMENT) {
      const myDigests = this.paymentChannel.createDigests(
        message.digests.length,
      );
      this.paymentChannel.buildNewBranch(
        [message.digests, myDigests],
        message.multisig,
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

  depositSent(hash: Hash, amount: number): void;

  signedTransaction(signedBundles: any[], value: number, close: boolean): void;

  creditsLeft(amount: number, distance: number, millis: number): void;

  creditsExausted(minimumAmount: number): void;

  closePaymentChannel(bundleHash: Hash): void;
}

export enum State {
  TRIP_REQUESTED,
  VEHICLE_AUTHENTICATED,
  ROUTE_PRICED,
  PAYMENT_CHANNEL_OPENED,
  READY_FOR_PAYMENT,
  CLOSED,
}
