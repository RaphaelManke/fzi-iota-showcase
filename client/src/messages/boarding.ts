import { Trytes, Hash } from '@iota/core/typings/types';

export interface PaymentChannel<DIGEST, MULTISIG_ADDRESS, BUNDLE> {
  state: PaymentChannelState;

  open(
    settlementAddress: Hash,
    userIndex: number,
    seed: number,
    signersCount: number,
    settlement: Hash,
    digests: DIGEST[], // TODO
    depth: number,
    security: number,
  ): void;

  updateDeposit(deposits: number[]): void;

  prepareChannel(allDigests: DIGEST[], settlementAddresses: Hash[]): void;

  applyTransaction(signedBundles: BUNDLE[]): void;

  attachCurrentBundle(): Hash;

  buildNewBranch(
    allDigests: DIGEST[],
    multisigAddress: MULTISIG_ADDRESS,
  ): MULTISIG_ADDRESS[];

  createTransaction(
    amount: number,
    address: Hash,
    onCreateNewBranch: (multisig: MULTISIG_ADDRESS, generate: number) => void,
  ): { bundles: BUNDLE[]; signedBundles: BUNDLE[] };

  createCloseTransaction(): { bundles: BUNDLE[]; signedBundles: BUNDLE[] };

  signTransaction(bundles: BUNDLE[], signedBundles: BUNDLE[]): any[];

  createDigests(amount: number): DIGEST[];
}

export enum PaymentChannelState {
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
  digests: any[]; // TODO
  depth: number;
  security: number;
}

export interface DepositSentMessage {
  depositTransaction: Hash;
  amount: number;
}

export interface TransactionCreatedMessage {}

export interface TransactionSignedMessage {}

export interface CreatedNewBranchMessage {}

export interface CreditsLeftMessage {
  amount: number;
  distance: number;
  millis: number;
}

export interface CreditsExaustedMessage {
  minimumAmount: number;
}

export interface ClosePaymentChannelMessage {}
