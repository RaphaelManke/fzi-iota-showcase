import {
  PaymentChannel,
  VehicleAuthenticationMessage,
  CheckInMessage,
} from 'fzi-iota-showcase-client';
import { trits, trytes } from '@iota/converter';
import Kerl from '@iota/kerl';
import { Trytes } from '@iota/core/typings/types';

export class TripHandler {
  private vehicleAuthenticated = false;
  private price: number | undefined = undefined;

  constructor(
    private destination: Trytes,
    private checkInMessage: CheckInMessage,
    private nonce: Trytes,
    private paymentChannel: PaymentChannel<any, any, any>,
    private sender: Sender,
  ) {}

  public onVehicleAuthentication(message: VehicleAuthenticationMessage) {
    if (hash(message.nonce) === this.checkInMessage.hashedNonce) {
      if (message.sendAuth) {
        this.sender.userAuthentication(this.nonce);
      }
    } else {
    }
  }
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
  userAuthentication(nonce: Trytes): void;
}

export enum State {
  AUTHENTICATION_REQUESTED,
  DESTINATION_SENT,
  ROUTE_PRICED,
  PAYMENT_CHANNEL_OPENED,
  DEPOSIT_SENT,
  READY_FOR_PAYMENT,
  AWAIT_SIGNING,
}
