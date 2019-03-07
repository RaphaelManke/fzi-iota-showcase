import { trytes } from '@iota/converter';
import {publishVehicle} from '../src/vehiclePublisher';
import { Logger, readVehicle, readVehicleInfo} from 'fzi-iota-showcase-client';
const {log} = Logger;
import { expect } from 'chai';
import 'mocha';

describe('VehiclePublisher', () => {
  it('should publish vehicleData and read it from the tangle', async function() {
    this.timeout(60000); // timeout 1 minute
    let a: Chai.Assertion; // suppress tslint errors

    const seed = generateSeed();
    log.info('Seed: %s', seed);
    const provider = 'https://nodes.devnet.iota.org';
    const {raam, root} = await publishVehicle(provider, seed, 4, {type: 'car'});
    a = expect(raam).to.exist;
    a = expect(root).to.exist;
    log.info('Channel id: %s', trytes(raam.channelRoot));
    log.info('MetaInfo channel root: %s', root);
    const vehicle = await readVehicle(provider, raam.channelRoot);
    log.info('%O', vehicle);
    a = expect(vehicle).to.exist;
    const info = await readVehicleInfo(provider, raam.channelRoot);
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
