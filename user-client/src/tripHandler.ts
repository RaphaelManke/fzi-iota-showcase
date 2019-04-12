import {
  PaymentChannel,
  VehicleAuthenticationMessage,
} from 'fzi-iota-showcase-client';
import { Trytes } from '@iota/core/typings/types';

export class TripHandler {
  private vehicleAuthenticated = false;
  private price: number | undefined = undefined;

  constructor(
    private destination: Trytes,
    private paymentChannel: PaymentChannel<any, any, any>,
    private sender: Sender,
  ) {}

  public onVehicleAuthentication(message: VehicleAuthenticationMessage) {
    message.sendAuth;
  }
}

export interface Sender {}

export enum State {
  AUTHENTICATION_REQUESTED,
  DESTINATION_SENT,
  ROUTE_PRICED,
  PAYMENT_CHANNEL_OPENED,
  DEPOSIT_SENT,
  READY_FOR_PAYMENT,
  AWAIT_SIGNING,
}
