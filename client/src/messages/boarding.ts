import { Trytes, Hash } from '@iota/core/typings/types';

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

export interface CreatePaymentChannelMessage {}

export interface TransactionCreatedMessage {}

export interface TransactionSignedMessage {}

export interface CreateNewBranchMessage {}
