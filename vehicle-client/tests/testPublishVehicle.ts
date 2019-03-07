import { trytes } from '@iota/converter';
import {publishVehicle} from '../src/vehiclePublisher';
import { Logger, readVehicle, readVehicleInfo} from 'fzi-iota-showcase-client';
const {log} = Logger;

(async () => {
  try {
    const seed = generateSeed();
    log.info('Seed: %s', seed);
    const provider = 'https://nodes.devnet.iota.org';
    const {raam, root} = await publishVehicle(provider, seed, 4, {type: 'car'});
    log.info('Channel id: %s', trytes(raam.channelRoot));
    log.info('MetaInfo channel root: %s', root);
    const vehicle = await readVehicle(provider, raam.channelRoot);
    log.info('%O', vehicle);
    const info = await readVehicleInfo(provider, raam.channelRoot);
    if (vehicle) {
      log.info('readVehicle info equal to readVehicleInfo: %s',
        JSON.stringify(vehicle.info) === JSON.stringify(info));
    }
  } catch (e) {
    log.error(e);
  }
})();

function generateSeed(length = 81) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ9';
  const retVal = [];
  for (let i = 0, n = charset.length; i < length; ++i) {
      retVal[i] = charset.charAt(Math.floor(Math.random() * n));
  }
  const result = retVal.join('');
  return result;
}
