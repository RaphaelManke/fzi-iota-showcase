import { VehicleInfo, createAttachToTangle, Logger, ChainedMessageBuilder} from 'fzi-iota-showcase-client';
const {log} = Logger;
import { RAAM } from 'raam.client.js';
import { API, composeAPI } from '@iota/core';
import { MamWriter, MAM_MODE } from 'mam.ts';
import { getMetaInfoSeed, getMasterSeed } from './seeds';

async function createMasterChannel(iota: API, seed: string, capacity: number) {
  const raam = await RAAM.fromSeed(getMasterSeed(seed, capacity), {amount: capacity, iota, security: 1});
  log.debug('Vehicle channel created');
  return raam;
}

async function publishMetaInfoRoot(raam: RAAM, root: string) {
  const hash = await raam.publish(root);
  log.debug('Published metaInfo root');
  return {hash, raam};
}

async function publishMetaInfo(writer: MamWriter, info: VehicleInfo) {
  const tx = await writer.createAndAttach(JSON.stringify({put: info}));
  log.debug('Published metaInfo');
  return tx;
}

export async function publishVehicle(
    provider: string, seed: string, capacity: number, vehicleInfo: VehicleInfo,
    iota: API = composeAPI({
      provider,
      attachToTangle: createAttachToTangle(),
    })) {

  const metaInfoSeed = getMetaInfoSeed(seed);
  const infoChannel = new MamWriter(provider, metaInfoSeed, MAM_MODE.PUBLIC);
  infoChannel.EnablePowSrv(true);
  const root = infoChannel.getNextRoot();

  const [{hash: txHash, raam}, tx] = await Promise.all([
    createMasterChannel(iota, seed, capacity).then((masterChannel) => publishMetaInfoRoot(masterChannel, root)),
    publishMetaInfo(infoChannel, vehicleInfo),
  ]);
  return {raam, root, tx};
}
