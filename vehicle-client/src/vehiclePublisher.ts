import { VehicleInfo, createAttachToTangle, log } from 'fzi-iota-showcase-client';
import { RAAM } from 'raam.client.js';
import { API, composeAPI } from '@iota/core';
import { Hash, Transaction } from '@iota/core/typings/types';
import { MamWriter, MAM_MODE } from 'mam.ts';
import { getMetaInfoSeed, getMasterSeed } from './seeds';
import * as Bluebird from 'bluebird';

export async function addMetaInfo(provider: string, seed: string, info: any):
    Promise<{root: Hash, txs: Transaction[]}> {
  const infoChannel = await createMetaInfoWriter(provider, seed);
  await infoChannel.catchUpThroughNetwork();
  const root: Hash = infoChannel.getNextRoot();
  return {root, txs: await publishMetaInfo(infoChannel, info)};
}

export async function publishVehicle(
    provider: string, seed: string, capacity: number, vehicleInfo: VehicleInfo,
    iota: API = composeAPI({
      provider,
      attachToTangle: createAttachToTangle(),
    })): Promise<{masterChannel: RAAM, metaInfoChannelRoot: Hash, metaInfoChannel: MamWriter, iota: API}> {

  const metaInfoChannel = createMetaInfoWriter(provider, seed);
  const metaInfoChannelRoot: Hash = metaInfoChannel.getNextRoot();

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

async function publishMetaInfoRoot(masterChannel: RAAM, root: string): Promise<{hash: Hash, masterChannel: RAAM}> {
  const hash = await masterChannel.publish(root);
  log.debug('Published metaInfo root');
  return {hash, masterChannel};
}

async function publishMetaInfo(writer: MamWriter, info: VehicleInfo): Promise<Transaction[]> {
  const txs = await writer.createAndAttach(JSON.stringify({put: info}));
  log.debug('Published metaInfo');
  return txs;
}

function createMetaInfoWriter(provider: string, seed: string) {
  const metaInfoSeed = getMetaInfoSeed(seed);
  const infoChannel = new MamWriter(provider, metaInfoSeed, MAM_MODE.PUBLIC);
  infoChannel.EnablePowSrv(true);
  return infoChannel;
}
