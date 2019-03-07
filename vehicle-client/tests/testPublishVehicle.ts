import { trytes } from '@iota/converter';
import { Logger } from 'fzi-iota-showcase-client';
import {publishVehicle, readMetaInfo} from '../src/vehiclePublisher';
const {log} = Logger;

(async () => {
  try {
    const seed = generateSeed();
    log.info('Seed: %s', seed);
    const provider = 'https://nodes.devnet.iota.org';
    const {raam, root} = await publishVehicle(provider, seed, 4, {type: 'car'});
    log.info('Channel id: %s', trytes(raam.channelRoot));
    log.info('MetaInfo channel root: %s', root);
    const info = await readMetaInfo(provider, root);
    log.info('MetaInfo: %o', info);
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
