import { VehicleInfo, createAttachToTangle, log} from 'fzi-iota-showcase-client';
import { RAAM, RAAMReader } from 'raam.client.js';
import { trytes } from '@iota/converter';
import { API, composeAPI } from '@iota/core';
import { MamWriter, MAM_MODE, MamReader } from 'mam.ts';

async function createMasterChannel(iota: API, seed: string, capacity: number) {
  const raam = await RAAM.fromSeed(seed, {amount: capacity, iota});
  log.debug('Vehicle channel created');
  return raam;
}

async function publishMetaInfoRoot(raam: RAAM, root: string) {
  const hash = await raam.publish(root);
  log.debug('Published metaInfo root');
  return {hash, raam};
}

async function readMetaInfo(provider: string, root: string) {
  const reader = new MamReader(provider, root);
  reader.setRoot(root);
  const message: string = await reader.fetchSingle();
  return message;
}

async function publishMetaInfo(writer: MamWriter, info: VehicleInfo) {
  const tx = await writer.createAndAttach(JSON.stringify(info));
  log.debug('Published metaInfo');
  return tx;
}

export async function publishVehicle(provider: string, seed: string, capacity: number, vehicleInfo: VehicleInfo) {
  const infoChannel = new MamWriter(provider, seed, MAM_MODE.PUBLIC);
  infoChannel.EnablePowSrv(true);
  const root = infoChannel.getNextRoot();

  const iota = composeAPI({
    provider,
    attachToTangle: createAttachToTangle(),
  });

  const [{hash, raam}, tx] = await Promise.all([
    createMasterChannel(iota, seed, capacity).then((masterChannel) => publishMetaInfoRoot(masterChannel, root)),
    publishMetaInfo(infoChannel, vehicleInfo), // .then(() => readMetaInfo(provider, root)),
  ]);
  return {raam, root};
}

(async () => {
  try {
    const seed = generateSeed();
    log.info('Seed: %s', seed);
    const {raam, root} = await publishVehicle('https://nodes.devnet.iota.org', seed, 4, {type: 'car'});
    log.info('Channel id: %s', trytes(raam.channelRoot));
    log.info('MetaInfo channel root: %s', root);
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
