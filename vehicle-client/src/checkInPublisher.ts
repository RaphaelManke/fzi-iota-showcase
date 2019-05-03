import { getTripSeed, getReservationSeed } from './seeds';
import {
  CheckInMessage,
  StopWelcomeMessage,
  log,
  toTrytes,
  getDateTag,
  Exception,
  intToPaddedTrytes,
  createAttachToTangle,
} from 'fzi-iota-showcase-client';
import { API } from '@iota/core';
import { Hash, Trytes, Tag, Transaction } from '@iota/core/typings/types';
import { RAAM } from 'raam.client.js';
import { MamWriter, MAM_MODE } from 'mam.ts';

export async function publishCheckIn(
  provider: string,
  seed: string,
  masterChannel: RAAM,
  address: Hash,
  checkInMessage: CheckInMessage,
  {
    depth = 3,
    mwm = 14,
    date = new Date(),
  }: { depth?: number; mwm?: number; date?: Date } = {
    depth: 3,
    mwm: 14,
    date: new Date(),
  },
): Promise<{
  reservationChannel: MamWriter;
  tripChannel: RAAM;
  welcomeMessage: StopWelcomeMessage;
  checkInTx: Transaction;
  welcomeMsgBundle: Transaction[];
}> {
  if (masterChannel.iota) {
    const reservationsSeed = getReservationSeed(
      seed,
      checkInMessage.tripChannelIndex,
    );
    const reservationChannel = new MamWriter(
      provider,
      reservationsSeed,
      MAM_MODE.PUBLIC,
    );
    Object.assign(reservationChannel, {
      // dirty hack. mam.ts supports powsrv only with api_key
      attachFunction: createAttachToTangle(provider),
    });
    // reservationChannel.EnablePowSrv(true);
    checkInMessage.reservationRoot = reservationChannel.getNextRoot();
    log.debug('Created reservation root');
    log.silly('\'%s\'', checkInMessage.reservationRoot);

    const [checkInTx, tripChannel] = await Promise.all([
      publishCheckInMessage(masterChannel.iota, address, checkInMessage, {
        depth,
        mwm,
        tag: getDateTag(date),
      }),
      createTripChannel(seed, masterChannel, checkInMessage.tripChannelIndex),
    ]);

    const welcomeMessage: StopWelcomeMessage = {
      checkInMessageRef: checkInTx.hash,
      tripChannelId: tripChannel.channelRoot,
    };
    const welcomeMsgBundle = await publishWelcomeMessage(
      masterChannel,
      checkInMessage.tripChannelIndex,
      welcomeMessage,
      { password: checkInMessage.password, depth, mwm },
    );

    return {
      reservationChannel,
      tripChannel,
      welcomeMessage,
      checkInTx,
      welcomeMsgBundle,
    };
  } else {
    throw new Error(
      'Master channel must be initialized with an instance of IOTA API.',
    );
  }
}

async function publishCheckInMessage(
  iota: API,
  address: Hash,
  checkInMessage: CheckInMessage,
  {
    depth = 3,
    mwm = 14,
    tag = getDateTag(),
  }: { depth?: number; mwm?: number; tag?: Tag },
) {
  const trytesMessage = toTrytes(checkInMessage);
  const message = intToPaddedTrytes(trytesMessage.length, 3) + trytesMessage;
  if (message.length <= 2187) {
    const transfers = [
      {
        address,
        message,
        tag,
        value: 0,
      },
    ];
    try {
      const trytes = await iota.prepareTransfers('9'.repeat(81), transfers);
      const txs = await iota.sendTrytes(trytes, depth, mwm);
      const result = txs[0];
      log.debug('Published CheckInMessage.');
      log.silly('Tx Hash: \'%s\'', result.hash);
      return result;
    } catch (e) {
      throw new Exception('Publishing CheckInMessage failed', e);
    }
  } else {
    throw new Error(
      'CheckInMessage is too long. It must fit into one transaction.',
    );
  }
}

async function createTripChannel(
  seed: string,
  masterChannel: RAAM,
  index: number,
) {
  const result = await RAAM.fromSeed(getTripSeed(seed, index), {
    amount: 2,
    iota: masterChannel.iota,
  });
  log.debug('TripChannel created');
  return result;
}

async function publishWelcomeMessage(
  masterChannel: RAAM,
  index: number,
  welcomeMessage: StopWelcomeMessage,
  {
    password,
    depth = 3,
    mwm = 14,
  }: { password?: Trytes; depth?: number; mwm?: number },
) {
  const result = await masterChannel.publish(welcomeMessage.checkInMessageRef, {
    index,
    depth,
    mwm,
    nextRoot: welcomeMessage.tripChannelId,
    messagePassword: password,
  });
  log.debug('Published WelcomeMessage.');
  log.silly('Bundle: \'%s\'', result[0].bundle);
  return result;
}
