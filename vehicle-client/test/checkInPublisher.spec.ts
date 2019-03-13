import { publishCheckIn } from '../src/checkInPublisher';
import { log, createAttachToTangle, CheckInMessage } from 'fzi-iota-showcase-client';
import { composeAPI } from '@iota/core';
import { trytes } from '@iota/converter';
import { RAAM } from 'raam.client.js';
import { expect } from 'chai';
import 'mocha';

describe('CheckInPublisher', () => {
  it('should publish a check in on the tangle', async function() {
    this.timeout(60000); // timeout 1 minute

    const provider = 'https://nodes.devnet.iota.org';
    const seed = generateSeed();
    log.info('Seed: %s', seed);
    const raam = await RAAM.fromSeed(seed, {amount: 2, iota: composeAPI({
      provider,
      attachToTangle: createAttachToTangle(),
    })});
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
