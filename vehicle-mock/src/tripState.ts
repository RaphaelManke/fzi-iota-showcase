import { RAAM } from 'raam.client.js';
import { MamWriter } from 'mam.ts';
import { StopWelcomeMessage, CheckInMessage } from 'fzi-iota-showcase-client';
import { Trytes } from '@iota/core/typings/types';

export interface TripState {
  tripChannel: RAAM;
  reservationChannel: MamWriter;
  welcomeMessage: StopWelcomeMessage;
  checkInMessage: CheckInMessage;
  nonce: Trytes;
  state: State;
}

export enum State {
  CHECKED_IN,

  RESERVED,

  DEPARTED,

  FINISHED,
}
