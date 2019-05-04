import {
  PaymentChannel,
  VehicleAuthenticationMessage,
  CheckInMessage,
  PriceMessage,
  DepositSentMessage,
  CreditsLeftMessage,
  OpenPaymentChannelMessage,
  TransactionSignedMessage,
  ClosePaymentChannelMessage,
  CancelBoardingMessage,
  CreditsExaustedMessage,
  log,
  PaymentChannelState,
  TransactionCreatedMessage,
} from 'fzi-iota-showcase-client';
import { trits, trytes } from '@iota/converter';
import Kerl from '@iota/kerl';
import { Trytes, Hash, Bundle } from '@iota/core/typings/types';
import { CreatedNewBranchMessage } from 'fzi-iota-showcase-client';

export class TripHandler {
  public static CREDITS_LEFT_FOR_MILLIS_LOWER_BOUND = 5000;

  private state = State.AUTHENTICATION_REQUESTED;
  private price?: number;
  private digests?: any[];
  private vehicleAddress?: Hash;
  private branchWaiter?: (digests: any[]) => void;

  private remainingToPay?: number;
  private paymentValue?: number;
  private remainingPayments?: number;
  private issuedPayment?: NodeJS.Timer;
  private lastMillisLeft?: number;

  constructor(
    private destination: Trytes,
    private checkInMessage: CheckInMessage,
    private maxPrice: number,
    private nonce: Trytes,
    private settlementAddress: Hash,
    private paymentAmount: number,
    private depositor: (value: number, address: Hash) => Promise<Hash>,
    private txReader: (bundleHash: Hash) => Promise<Bundle>,
    private paymentChannel: PaymentChannel<any, any, any>,
    private sender: Sender,
  ) {}

  public onVehicleAuthentication(message: VehicleAuthenticationMessage) {
    log.silly('Vehicle authenticated %O', message);
    if (hash(message.nonce) === this.checkInMessage.hashedNonce) {
      this.state = State.DESTINATION_SENT;
      this.sender.sendDestination(this.destination, this.nonce);
    } else {
      this.sender.cancelBoarding('Verifying nonce failed');
      this.state = State.CLOSED;
    }
  }

  public onPriceSent(message: PriceMessage) {
    log.silly('Vehicle sent price %O', message);
    if (!this.price) {
      this.price = message.price;
      this.remainingToPay = this.price;
      if (this.price > this.maxPrice) {
        this.sender.cancelBoarding('Price is too high');
        this.state = State.CLOSED;
      } else {
        this.state = State.ROUTE_PRICED;
        this.openPaymentChannel();
      }
    } else {
      const delta = message.price - this.price;
      this.remainingToPay! += delta;
      this.price = message.price;
      this.paymentValue = Math.round(
        this.remainingToPay! / this.remainingPayments!,
      );
      log.debug(
        'User trip repriced. %s tokens left to pay.',
        this.remainingToPay,
      );
      if (!this.issuedPayment) {
        this.sendTransaction();
      }
      if (this.paymentChannel.state === PaymentChannelState.UNINITIALIZED) {
        // payment channel was not opened
        this.openPaymentChannel();
      } else {
        if (
          this.remainingToPay === 0 &&
          this.state === State.READY_FOR_PAYMENT
        ) {
          this.sendCloseTransaction();
        }
      }
    }
  }

  public async onPaymentChannelOpened(message: OpenPaymentChannelMessage) {
    log.silly('Vehicle opened payment channel %O', message);
    if (this.state === State.PAYMENT_CHANNEL_OPENED) {
      this.vehicleAddress = message.settlement;
      await this.paymentChannel.prepareChannel(
        [this.digests, message.digests],
        [this.settlementAddress, message.settlement],
      );
      try {
        const bundleHash = await this.depositor(
          this.price!,
          this.paymentChannel.rootAddress,
        );
        this.state = State.DEPOSIT_SENT;
        this.sender.depositSent(
          bundleHash,
          this.price!,
          this.paymentChannel.rootAddress,
        );
      } catch (e) {
        this.state = State.CLOSED;
        log.error('User failed sending deposit. %s', e);
        this.sender.cancelBoarding('Could not send deposit.');
      }
    } else {
      this.state = State.CLOSED;
      this.sender.cancelBoarding(
        'Payment channel can\'t be opened. Wrong state.',
      );
      throw new Error(
        `State must be 'PAYMENT_CHANNEL_OPENED' but is '${State[this.state]}'`,
      );
    }
  }

  public async onDepositSent(message: DepositSentMessage) {
    log.silly('Vehicle sent deposit %O', message);
    if (this.state === State.DEPOSIT_SENT) {
      try {
        const txs = await this.txReader(message.depositTransaction);
        const tx = txs.find((t) => t.address === this.paymentChannel.rootAddress);
        if (tx) {
          if (tx.value === this.price) {
            this.paymentChannel.updateDeposit([this.price, tx.value]);
            this.state = State.READY_FOR_PAYMENT;
            this.sendTransaction();
          } else {
            this.state = State.CLOSED;
            this.sender.cancelBoarding('Transaction has false amount');
          }
        } else {
          this.state = State.CLOSED;
          log.debug('Vehicle sent bundle %O', txs);
          this.sender.cancelBoarding('Transaction is not for multisig root');
        }
      } catch (e) {
        this.state = State.CLOSED;
        log.error('User failed reading deposit tx. %s', e);
        this.sender.cancelBoarding('Could not read deposit.');
      }
    }
  }

  public onCreatedNewBranch(message: CreatedNewBranchMessage) {
    log.silly('Vehicle created new branch %O', message);
    if (this.branchWaiter && this.state === State.AWAIT_NEW_BRANCH) {
      if (this.branchWaiter) {
        this.branchWaiter(message.digests);
        this.branchWaiter = undefined;
      } else {
        // creation not issued by me
        const myDigests = this.paymentChannel.createDigests(
          message.digests.length,
        );
        this.paymentChannel.buildNewBranch(
          [message.digests, myDigests],
          message.multisig,
        );
      }
    } else {
      log.warn(
        `Client must have state 'AWAIT_BRANCH' but is ${State[this.state]}`,
      ); // TODO send close
      this.state = State.CLOSED;
    }
  }

  public onSignedTransaction(message: TransactionSignedMessage) {
    log.silly('Vehicle signed transaction %O', message);
    if (this.state === State.AWAIT_SIGNING) {
      this.paymentChannel.applyTransaction(message.signedBundles);
      this.issuedPayment = undefined;
      this.state = State.READY_FOR_PAYMENT;
    }
  }

  public onCreditsLeft(message: CreditsLeftMessage) {
    log.silly('Credits left updated %O', message);
    if (
      this.state === State.READY_FOR_PAYMENT &&
      !this.issuedPayment &&
      (!this.lastMillisLeft || message.millis <= this.lastMillisLeft)
    ) {
      this.lastMillisLeft = message.millis;
      if (message.millis < TripHandler.CREDITS_LEFT_FOR_MILLIS_LOWER_BOUND) {
        this.sendTransaction();
      } else {
        this.issuedPayment = setTimeout(
          () => this.sendTransaction(),
          message.millis - TripHandler.CREDITS_LEFT_FOR_MILLIS_LOWER_BOUND,
        );
      }
    }
  }

  public onCreditsExausted(message: CreditsExaustedMessage) {
    log.debug('Credits exausted %O', message);
    this.sendTransaction(message.minimumAmount);
  }

  public onClosedPaymentChannel(message: ClosePaymentChannelMessage) {
    log.silly('Vehicle closed payment channel %O', message);
    this.state = State.CLOSED;
  }

  public onBoardingCanceled(message: CancelBoardingMessage) {
    log.debug('Vehicle cancelled boarding %O', message);
    this.state = State.CLOSED;
  }

  public async onTransactionReceived(message: TransactionCreatedMessage) {
    log.silly('Vehicle sent transaction %O', message);
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
          this.remainingToPay! += tx.value;
          if (this.remainingToPay === 0) {
            this.sendCloseTransaction();
          }
        } else {
          log.warn('No value transaction was found in bundle');
          this.state = State.CLOSED;
        }
      } else {
        log.warn('Vehicle should not close payment channel');
      }
    } else {
      log.warn(`State must be 'READY_FOR_PAYMENT' but is ${State[this.state]}`);
      this.state = State.CLOSED;
    }
  }

  private openPaymentChannel() {
    const depth = Math.ceil(Math.log2(this.paymentAmount));
    this.remainingPayments = this.paymentAmount;
    this.paymentValue = Math.round(this.price! / this.paymentAmount);
    this.paymentChannel.open(
      this.settlementAddress,
      0,
      generateSeed(),
      2,
      depth,
      2,
    );
    this.digests = this.paymentChannel.createDigests();
    this.state = State.PAYMENT_CHANNEL_OPENED;
    this.sender.openPaymentChannel(
      0,
      this.settlementAddress,
      depth,
      2,
      this.digests,
    );
  }

  private async sendTransaction(
    amount = Math.min(this.remainingToPay!, this.paymentValue!),
  ) {
    if (this.state === State.READY_FOR_PAYMENT) {
      this.issuedPayment = setTimeout(() => {}, 0);
      if (amount > 0) {
        const {
          bundles,
          signedBundles,
        } = await this.paymentChannel.createTransaction(
          amount,
          this.vehicleAddress!,
          this.createNewBranch,
        );
        this.remainingToPay! -= amount;
        this.remainingPayments!--;
        this.state = State.AWAIT_SIGNING;
        this.sender.createdTransaction(bundles, signedBundles, false);
      } else {
        this.sendCloseTransaction();
      }
    } else {
      if (this.remainingToPay! > 0 && this.state !== State.CLOSED) {
        log.warn(`Payments remain but state is ${State[this.state]}`);
      }
    }
  }

  private sendCloseTransaction() {
    log.debug('No amount left to pay. Closing channel...');
    const {
      bundles,
      signedBundles,
    } = this.paymentChannel.createCloseTransaction();
    this.state = State.AWAIT_SIGNING;
    this.issuedPayment = setTimeout(() => {}, 0);
    this.sender.createdTransaction(bundles, signedBundles, true);
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
  cancelBoarding(reason?: string): void;

  sendDestination(destStop: Trytes, nonce?: Trytes): void;

  openPaymentChannel(
    userIndex: number,
    settlement: Hash,
    depth: number,
    security: number,
    digest: any[],
  ): void;

  depositSent(hash: Hash, amount: number, address: Hash): void;

  createdTransaction(bundles: any, signedBundles: any, close: boolean): void;

  createdNewBranch(digest: any[], multisig: any): void;

  signedTransaction(signedBundles: any[], value: number, close: boolean): void;
}

export enum State {
  AUTHENTICATION_REQUESTED,
  DESTINATION_SENT,
  ROUTE_PRICED,
  PAYMENT_CHANNEL_OPENED,
  DEPOSIT_SENT,
  READY_FOR_PAYMENT,
  AWAIT_SIGNING,
  AWAIT_NEW_BRANCH,
  CLOSED,
}
