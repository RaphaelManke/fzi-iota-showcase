import { publishCheckIn } from '../src/checkInPublisher';
import { log, CheckInMessage } from 'fzi-iota-showcase-client';
import { composeAPIOrSkip } from './iota';
import { API } from '@iota/core';
import { trytes } from '@iota/converter';
import { RAAM } from 'raam.client.js';
import { expect } from 'chai';
import 'mocha';

describe('CheckInPublisher', () => {
  let iota: API;
  let provider: string;

  before(async function() {
    ({iota, provider} = await composeAPIOrSkip(this, 'https://nodes.devnet.iota.org',
      'https://nodes.thetangle.org:443'));
  });

  it('should publish a check in on the tangle', async function() {
    this.timeout(60000); // timeout 1 minute

    const seed = generateSeed();
    log.info('Seed: %s', seed);
    const raam = await RAAM.fromSeed(seed, {amount: 2, iota});
    log.info('MasterChannel id: %s', trytes(raam.channelRoot));
    const address = generateSeed();
    const message: CheckInMessage = {
      paymentAddress: '9'.repeat(81),
      price: 4000000,
      reservationRate: 400000,
      tripChannelIndex: 1,
      vehicleId: raam.channelRoot,
    };
    const {reservationChannel, tripChannel, welcomeMessage}
     = await publishCheckIn(provider, seed, raam, address, message);
  });
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
