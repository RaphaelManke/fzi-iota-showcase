import { RAAM } from 'raam.client.js';
import { MamWriter } from 'mam.ts';
import {
  StopWelcomeMessage,
  CheckInMessage,
  Reservation,
} from 'fzi-iota-showcase-client';
import { Trytes } from '@iota/core/typings/types';
import { BoardingHandler } from 'fzi-iota-showcase-vehicle-client';
import { Boarder } from './boarder';
import { Path } from './pathFinder';

export interface TripState {
  tripChannel: RAAM;
  reservationChannel: MamWriter;
  welcomeMessage: StopWelcomeMessage;
  checkInMessage: CheckInMessage;
  reservations: Reservation[];
  nonce: Trytes;
  state: State;
  start: Trytes;
  destination?: Trytes;
  path?: Path;
  boarders: Boarder[];
}

export enum State {
  CHECKED_IN,

  RESERVED,

  DEPARTED,

  FINISHED,
}
