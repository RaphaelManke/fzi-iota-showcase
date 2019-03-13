import { VehicleInfo, createAttachToTangle, log } from 'fzi-iota-showcase-client';
import { RAAM } from 'raam.client.js';
import { API, composeAPI } from '@iota/core';
import { MamWriter, MAM_MODE } from 'mam.ts';
import { getMetaInfoSeed, getMasterSeed } from './seeds';

export async function addMetaInfo(provider: string, seed: string, info: any) {
  const infoChannel = await createMetaInfoWriter(provider, seed);
  await infoChannel.catchUpThroughNetwork();
  const root = infoChannel.getNextRoot();
  return {root, tx: await publishMetaInfo(infoChannel, info)};
}

export async function publishVehicle(
    provider: string, seed: string, capacity: number, vehicleInfo: VehicleInfo,
    iota: API = composeAPI({
      provider,
      attachToTangle: createAttachToTangle(),
    })) {

  const metaInfoChannel = createMetaInfoWriter(provider, seed);
  const metaInfoChannelRoot = metaInfoChannel.getNextRoot();

  const [{hash: txHash, masterChannel}, tx] = await Promise.all([
    createMasterChannel(iota, seed, capacity).then((channel) => publishMetaInfoRoot(channel, metaInfoChannelRoot)),
    publishMetaInfo(metaInfoChannel, vehicleInfo),
  ]);
  return {masterChannel, metaInfoChannelRoot, metaInfoChannel, iota};
}

async function createMasterChannel(iota: API, seed: string, capacity: number) {
  const masterChannel = await RAAM.fromSeed(getMasterSeed(seed, capacity), {amount: capacity, iota, security: 1});
  log.debug('Vehicle channel created');
  return masterChannel;
}

async function publishMetaInfoRoot(masterChannel: RAAM, root: string) {
  const hash = await masterChannel.publish(root);
  log.debug('Published metaInfo root');
  return {hash, masterChannel};
}

async function publishMetaInfo(writer: MamWriter, info: VehicleInfo) {
  const tx = await writer.createAndAttach(JSON.stringify({put: info}));
  log.debug('Published metaInfo');
  return tx;
}

function createMetaInfoWriter(provider: string, seed: string) {
  const metaInfoSeed = getMetaInfoSeed(seed);
  const infoChannel = new MamWriter(provider, metaInfoSeed, MAM_MODE.PUBLIC);
  infoChannel.EnablePowSrv(true);
  return infoChannel;
}
