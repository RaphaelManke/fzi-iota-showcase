import { trytes } from '@iota/converter';
import {publishVehicle } from '../src/vehiclePublisher';
import { API } from '@iota/core';
import { log, readVehicle, readVehicleInfo } from 'fzi-iota-showcase-client';
import { composeAPIOrSkip } from './iota';
import { expect } from 'chai';
import 'mocha';

describe('VehiclePublisher', () => {
  let iota: API;
  let provider: string;

  before(async function() {
    ({iota, provider} = await composeAPIOrSkip(this, 'https://nodes.devnet.iota.org',
      'https://nodes.thetangle.org'));
  });

  it('should publish vehicleData and read it from the tangle', async function() {
    this.timeout(60000); // timeout 1 minute
    let a: Chai.Assertion; // suppress tslint errors

    const seed = generateSeed();
    log.info('Seed: %s', seed);
    const {masterChannel, metaInfoChannelRoot} = await publishVehicle(provider, seed, 4, {type: 'car'}, iota);
    a = expect(masterChannel).to.exist;
    a = expect(metaInfoChannelRoot).to.exist;
    log.info('Channel id: %s', trytes(masterChannel.channelRoot));
    log.info('MetaInfo channel root: %s', metaInfoChannelRoot);
    const vehicle = await readVehicle(provider, masterChannel.channelRoot);
    log.info('Vehicle\n%O', {
      ...vehicle,
      vehicleId: vehicle ? trytes(vehicle.vehicleId) : '',
    });
    a = expect(vehicle).to.exist;
    const info = await readVehicleInfo(provider, masterChannel.channelRoot);
    a = expect(info).to.exist;
    if (vehicle) {
      expect(info).to.deep.equal(vehicle.info);
    }
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
