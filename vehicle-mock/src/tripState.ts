import { RAAM } from 'raam.client.js';
import { MamWriter } from 'mam.ts';
import {
  StopWelcomeMessage,
  CheckInMessage,
  Reservation,
} from 'fzi-iota-showcase-client';
import { Trytes, Hash } from '@iota/core/typings/types';
import { Boarder } from './boarder';
import { Path } from './pathFinder';

export interface TripState {
  tripChannel: RAAM;
  reservationChannel: MamWriter;
  welcomeMessage: StopWelcomeMessage;
  checkInMessage: CheckInMessage;
  reservations: Reservation[];
  nonce: Trytes;
  addressIndex: number;
  state: State;
  start: Trytes;
  destination?: Trytes;
  path?: Path;
  boarding: Array<Promise<any>>;
  boarders: Boarder[];
}

export enum State {
  CHECKED_IN,

  RESERVED,

  DEPARTED,

  FINISHED,
}
