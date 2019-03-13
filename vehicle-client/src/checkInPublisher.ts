import { getTripSeed, getReservationSeed } from './seeds';
import { CheckInMessage, StopWelcomeMessage, log, toTrytes, getDateTag, Exception } from 'fzi-iota-showcase-client';
import { API } from '@iota/core';
import { Hash } from '@iota/core/typings/types';
import { RAAM } from 'raam.client.js';
import { MamWriter, MAM_MODE } from 'mam.ts';

export async function publishCheckIn(provider: string, seed: string, masterChannel: RAAM, address: Hash,
                                     checkInMessage: CheckInMessage, {depth = 3, mwm = 14}:
                                     {depth: number, mwm: number} = {depth: 3, mwm: 14}) {
  if (masterChannel.iota) {
    const reservationsSeed = getReservationSeed(seed, checkInMessage.tripChannelIndex);
    const reservationChannel = new MamWriter(provider, reservationsSeed, MAM_MODE.PUBLIC);
    checkInMessage.reservationRoot = reservationChannel.getNextRoot();
    log.debug('Created reservation root');

    const [txs, tripChannel] = await Promise.all([
      await publishCheckInMessage(masterChannel.iota, address, checkInMessage, {depth, mwm}),
      await createTripChannel(seed, masterChannel, checkInMessage.tripChannelIndex),
    ]);

    const welcomeMessage: StopWelcomeMessage = {
      checkInMessageRef: txs[0].hash,
      tripChannelId: tripChannel.channelRoot,
    };
    await publishWelcomeMessage(masterChannel, checkInMessage.tripChannelIndex, welcomeMessage, {depth, mwm});

    return {reservationChannel, tripChannel, welcomeMessage};
  } else {
    throw new Error('Master channel must be initialized with an instance of IOTA API.');
  }
}

async function publishCheckInMessage(iota: API, address: Hash, checkInMessage: CheckInMessage,
                                     {depth = 3, mwm = 14}: {depth: number, mwm: number}) {
  const message = toTrytes(checkInMessage);
  if (message.length <= 2187) {
    const transfers = [{
      address,
      message,
      tag: getDateTag(),
      value: 0,
    }];
    try {
      const trytes = await iota.prepareTransfers('9'.repeat(81), transfers);
      const result = await iota.sendTrytes(trytes, depth, mwm);
      log.debug('Published CheckInMessage');
      return result;
    } catch (e) {
      throw new Exception('Publishing CheckInMessage failed', e);
    }
  } else {
    throw new Error('CheckInMessage is too long. It must fit into one transaction.');
  }
}

async function createTripChannel(seed: string, masterChannel: RAAM, index: number) {
  const result = await RAAM.fromSeed(getTripSeed(seed, index), {amount: 2, iota: masterChannel.iota});
  log.debug('TripChannel created');
  return result;
}

async function publishWelcomeMessage(masterChannel: RAAM, index: number, welcomeMessage: StopWelcomeMessage,
                                     {depth = 3, mwm = 14}: {depth: number, mwm: number}) {
  const result = await masterChannel.publish(welcomeMessage.checkInMessageRef,
    {index, depth, mwm, nextRoot: welcomeMessage.tripChannelId});
  log.debug('Published WelcomeMessage');
  return result;
}

