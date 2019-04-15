import { Trytes, Hash } from '@iota/core/typings/types';

export interface PaymentChannel<DIGEST, MULTISIG_ADDRESS, BUNDLE> {
  state: PaymentChannelState;
  rootAddress: Hash;

  open(
    settlementAddress: Hash,
    userIndex: number,
    seed: Hash,
    signersCount: number,
    depth: number,
    security: number,
  ): void;

  updateDeposit(deposits: number[]): void;

  prepareChannel(allDigests: DIGEST[], settlementAddresses: Hash[]): void;

  applyTransaction(signedBundles: BUNDLE[]): void;

  attachCurrentBundle(): Promise<Hash>;

  buildNewBranch(
    allDigests: DIGEST[],
    multisigAddress: MULTISIG_ADDRESS,
  ): Promise<MULTISIG_ADDRESS[]>;

  createTransaction(
    amount: number,
    address: Hash,
    onCreateNewBranch: (multisig: MULTISIG_ADDRESS, generate: number) => void,
  ): Promise<{ bundles: BUNDLE[]; signedBundles: BUNDLE[] }>;

  createCloseTransaction(): { bundles: BUNDLE[]; signedBundles: BUNDLE[] };

  signTransaction(bundles: BUNDLE[], signedBundles: BUNDLE[]): any[];

  extractTransfers(
    bundles: BUNDLE[],
    fromIndex: number,
  ): Array<{ value: number; address: Hash }>;

  createDigests(amount?: number): DIGEST[];
}

export enum PaymentChannelState {
  UNINITIALIZED,
  CREATED,
  GENERATED_DIGESTS,
  WAIT_FOR_DEPOSIT,
  READY,
  SIGNED_TRANSACTION,
  PREPARE_NEW_BRANCH,
  CLOSED,
}

export interface VehicleAuthenticationMessage {
  nonce: Trytes;
  sendAuth: boolean;
}

export interface DestinationMessage {
  nonce?: Trytes;
  destStop: Hash;
}

export interface PriceMessage {
  price: number;
}

export interface OpenPaymentChannelMessage {
  userIndex: number;
  settlement: Hash;
  depth: number;
  security: number;
  digests: any[];
}

export interface DepositSentMessage {
  depositTransaction: Hash;
  amount: number;
}

export interface TransactionCreatedMessage {
  bundles: any[];
  signedBundles: any[];
  close: boolean;
}

export interface TransactionSignedMessage {
  signedBundles: any[];
  value: number;
  close: boolean;
}

export interface CreatedNewBranchMessage {
  digests: any[];
  multisig: any;
}

export interface CreditsLeftMessage {
  amount: number;
  distance: number;
  millis: number;
}

export interface CreditsExaustedMessage {
  minimumAmount: number;
}

export interface ClosePaymentChannelMessage {
  bundleHash: Hash;
}

export interface CancelBoardingMessage {
  reason?: string;
}
