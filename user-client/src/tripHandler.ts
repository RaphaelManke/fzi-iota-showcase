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
} from 'fzi-iota-showcase-client';
import { trits, trytes } from '@iota/converter';
import Kerl from '@iota/kerl';
import { Trytes, Hash, Bundle } from '@iota/core/typings/types';
import { CreatedNewBranchMessage } from 'fzi-iota-showcase-client';

export class TripHandler {
  public static CREDITS_LEFT_FOR_MILLIS_LOWER_BOUND = 5000;

  private state = State.AUTHENTICATION_REQUESTED;
  private price: number | undefined = undefined;
  private digests: any[] | undefined;
  private vehicleAddress: Hash | undefined;
  private branchWaiter: undefined | ((digests: any[]) => void);
  private remaining: undefined | number;
  private issuedPayment = false;

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
    log.debug('Vehicle authenticated %O', message);
    if (hash(message.nonce) === this.checkInMessage.hashedNonce) {
      this.state = State.DESTINATION_SENT;
      this.sender.sendDestination(this.destination, this.nonce);
    } else {
      this.sender.cancelBoarding('Verifying nonce failed');
      this.state = State.CLOSED;
    }
  }

  public onPriceSent(message: PriceMessage) {
    log.debug('Vehicle sent price %O', message);
    this.price = message.price;
    this.remaining = this.price;
    if (this.price > this.maxPrice) {
      this.sender.cancelBoarding('Price is too high');
      this.state = State.CLOSED;
    } else {
      this.state = State.ROUTE_PRICED;
      const depth = Math.ceil(Math.log2(this.paymentAmount));
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
  }

  public async onPaymentChannelOpened(message: OpenPaymentChannelMessage) {
    log.debug('Vehicle opened payment channel %O', message);
    if (this.state === State.PAYMENT_CHANNEL_OPENED) {
      this.vehicleAddress = message.settlement;
      this.paymentChannel.prepareChannel(
        [this.digests, message.digests],
        [this.settlementAddress, message.settlement],
      );
      const bundleHash = await this.depositor(
        this.price!,
        this.paymentChannel.rootAddress,
      );
      this.state = State.DEPOSIT_SENT;
      this.sender.depositSent(bundleHash, this.price!);
    } else {
      this.state = State.CLOSED;
      throw new Error(
        `State must be 'PAYMENT_CHANNEL_OPENED' but is '${this.state}'`,
      );
    }
  }

  public async onDepositSent(message: DepositSentMessage) {
    log.debug('Vehicle sent deposit %O', message);
    if (this.state === State.DEPOSIT_SENT) {
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
    }
  }

  public onCreatedNewBranch(message: CreatedNewBranchMessage) {
    log.debug('Vehicle created new branch %O', message);
    if (this.branchWaiter && this.state === State.AWAIT_NEW_BRANCH) {
      this.branchWaiter(message.digests);
    } else {
      throw new Error(
        `Client must have state 'AWAIT_BRANCH' but is ${this.state}`,
      );
    }
  }

  public onSignedTransaction(message: TransactionSignedMessage) {
    log.debug('Vehicle signed transaction %O', message);
    if (this.state === State.AWAIT_SIGNING) {
      this.paymentChannel.applyTransaction(message.signedBundles);
      this.issuedPayment = false;
      this.state = State.READY_FOR_PAYMENT;
    }
  }

  public onCreditsLeft(message: CreditsLeftMessage) {
    log.debug('Credits left updated %O', message);
    if (this.state === State.READY_FOR_PAYMENT && !this.issuedPayment) {
      if (message.millis < TripHandler.CREDITS_LEFT_FOR_MILLIS_LOWER_BOUND) {
        this.sendTransaction();
      } else {
        this.issuedPayment = true;
        setTimeout(
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
    log.debug('Vehicle closed payment channel %O', message);
    this.state = State.CLOSED;
  }

  public onBoardingCanceled(message: CancelBoardingMessage) {
    log.debug('Vehicle cancelled boarding %O', message);
    this.state = State.CLOSED;
  }

  private async sendTransaction(
    amount = Math.min(
      this.remaining!,
      Math.round(this.price! / this.paymentAmount),
    ),
  ) {
    if (this.state === State.READY_FOR_PAYMENT) {
      this.issuedPayment = true;
      // TODO
      if (amount > 0) {
        const {
          bundles,
          signedBundles,
        } = await this.paymentChannel.createTransaction(
          amount,
          this.vehicleAddress!,
          this.createNewBranch,
        );
        this.remaining! -= amount;
        this.state = State.AWAIT_SIGNING;
        this.sender.createdTransaction(bundles, signedBundles, false);
      } else {
        log.debug('No amount left to pay. Closing channel...');
        const {
          bundles,
          signedBundles,
        } = this.paymentChannel.createCloseTransaction();
        this.state = State.AWAIT_SIGNING;
        this.sender.createdTransaction(bundles, signedBundles, true);
      }
    } else {
      this.state = State.CLOSED;
      throw new Error('Client is not ready to make payments.');
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

  depositSent(hash: Hash, amount: number): void;

  createdTransaction(bundles: any, signedBundles: any, close: boolean): void;

  createdNewBranch(digest: any[], multisig: any): void;
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
