import { queryStop } from '../src/stopReader';
import { publishCheckIn, publishReservation, publishCheckOutMessage } from 'fzi-iota-showcase-vehicle-client';
import { log, CheckInMessage, readCheckIns, readTripFromMasterChannel, readDeparted,
  readReservations } from 'fzi-iota-showcase-client';
import { composeAPIOrSkip } from './iota';
import { API } from '@iota/core';
import { trytes } from '@iota/converter';
import { RAAM } from 'raam.client.js';
import { expect, use } from 'chai';
import * as chaiThings from 'chai-things';
import 'mocha';
import { Trytes } from '@iota/core/typings/types';
import { publishVehicle } from 'fzi-iota-showcase-vehicle-client/src/vehiclePublisher';
use(chaiThings);

describe('StopReader', () => {
  let iota: API;
  let provider: string;

  // making several calls to a full node may take time
  const TIMEOUT = 90000;

  before(async function() {
    ({iota, provider} = await composeAPIOrSkip(this, // 'https://nodes.devnet.iota.org',
      'https://nodes.thetangle.org'));
  });

  it('should publish a check in on the tangle', async function() {
    this.timeout(TIMEOUT);

    const {message, address, masterChannel, reservationChannel, tripChannel, welcomeMessage} = await checkIn();

    const offers = await queryStop(provider, iota, address, (offer) => {
      log.info('%O', {
        ...offer,
        vehicleId: offer.vehicleId ? trytes(offer.vehicleId) : undefined,
      });
    });

  });

  async function checkIn(password?: Trytes) {
    const seed = generateSeed();
    log.info('Seed: %s', seed);
    log.info('Creating vehicle...');
    const {masterChannel} = await publishVehicle(provider, seed, 4, {type: 'car'}, iota);
    log.info('MasterChannel id: %s', trytes(masterChannel.channelRoot));
    const address = generateSeed();
    log.info('Stop address: %s', address);
    const message: CheckInMessage = {
      paymentAddress: '9'.repeat(81),
      price: 4000000,
      reservationRate: 400000,
      tripChannelIndex: 1,
      vehicleId: masterChannel.channelRoot,
    };
    log.info('Publishing checkIn...');
    return {message, address, masterChannel,
      ...await publishCheckIn(provider, seed, masterChannel, address, message)};
  }
});

function generateSeed(length = 81) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ9';
  const retVal = [];
  for (let i = 0, n = charset.length; i < length; ++i) {
      retVal[i] = charset.charAt(Math.floor(Math.random() * n));
  }
  const result = retVal.join('');
  return result;
}
