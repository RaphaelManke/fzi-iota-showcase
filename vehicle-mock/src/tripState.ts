import { RAAM } from 'raam.client.js';
import { MamWriter } from 'mam.ts';
import { StopWelcomeMessage } from 'fzi-iota-showcase-client';
import { Trytes } from '@iota/core/typings/types';

export interface TripState {
  tripChannel: RAAM;
  reservationChannel: MamWriter;
  welcomeMessage: StopWelcomeMessage;
  nonce: Trytes;
  state: State;
}

export enum State {
  CHECKED_IN,

  RESERVED,

  DEPARTED,

  FINISHED,
}
