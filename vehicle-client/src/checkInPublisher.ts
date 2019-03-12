import { API } from '@iota/core';
import { CheckInMessage, toTrytes, getDateTag, StopWelcomeMessage } from 'fzi-iota-showcase-client';
import { Hash } from '@iota/core/typings/types';
import { RAAM } from 'raam.client.js';
import { getTripSeed, getReservationSeed } from './seeds';
import { MamWriter, MAM_MODE } from 'mam.ts';

export async function publishCheckIn(provider: string, seed: string, masterChannel: RAAM, address: Hash,
                                     checkInMessage: CheckInMessage, {depth = 3, mwm = 14}:
                                     {depth: number, mwm: number}) {
  if (masterChannel.iota) {
    const reservationsSeed = getReservationSeed(seed, checkInMessage.tripChannelIndex);
    const reservationChannel = new MamWriter(provider, reservationsSeed, MAM_MODE.PUBLIC);
    checkInMessage.reservationRoot = reservationChannel.getNextRoot();

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
  if (message.length > 2187) {
    const transfers = [{
      address,
      message,
      tag: getDateTag(),
      value: 0,
    }];
    const trytes = await iota.prepareTransfers('9'.repeat(81), transfers);
    return await iota.sendTrytes(trytes, depth, mwm);
  } else {
    throw new Error('CheckInMessage is too long. It must fit into one transaction.');
  }
}

async function createTripChannel(seed: string, masterChannel: RAAM, index: number) {
  return await RAAM.fromSeed(getTripSeed(seed, index), {amount: 2, iota: masterChannel.iota});
}

async function publishWelcomeMessage(masterChannel: RAAM, index: number, welcomeMessage: StopWelcomeMessage,
                                     {depth = 3, mwm = 14}: {depth: number, mwm: number}) {
  return await masterChannel.publish(welcomeMessage.checkInMessageRef,
    {index, depth, mwm, nextRoot: welcomeMessage.tripChannelId});
}

