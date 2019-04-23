import {
  VehicleInfo,
  createAttachToTangle,
  log,
} from 'fzi-iota-showcase-client';
import { RAAM } from 'raam.client.js';
import { API, composeAPI } from '@iota/core';
import { Hash, Transaction } from '@iota/core/typings/types';
import { MamWriter, MAM_MODE } from 'mam.ts';
import { getMetaInfoSeed, getMasterSeed } from './seeds';
import * as Bluebird from 'bluebird';

export async function addMetaInfo(
  provider: string,
  seed: string,
  info: any,
): Promise<{ root: Hash; bundle: string }> {
  const infoChannel = await createMetaInfoWriter(provider, seed);
  await infoChannel.catchUpThroughNetwork();
  const root: Hash = infoChannel.getNextRoot();
  return { root, bundle: await publishMetaInfo(infoChannel, info) };
}

export async function publishVehicle(
  provider: string,
  seed: string,
  capacity: number,
  vehicleInfo: VehicleInfo,
  iota: API = composeAPI({
    provider,
    attachToTangle: createAttachToTangle(provider),
  }),
): Promise<{
  masterChannel: RAAM;
  metaInfoChannelRoot: Hash;
  metaInfoChannel: MamWriter;
  metaInfoRootBundle: Hash;
  metaInfoBundle: Hash;
  iota: API;
}> {
  const metaInfoChannel = createMetaInfoWriter(provider, seed);
  const metaInfoChannelRoot: Hash = metaInfoChannel.getNextRoot();

  const [
    { metaInfoRootBundle, masterChannel },
    metaInfoBundle,
  ] = await Promise.all([
    createMasterChannel(iota, seed, capacity).then((channel) =>
      publishMetaInfoRoot(channel, metaInfoChannelRoot),
    ),
    publishMetaInfo(metaInfoChannel, vehicleInfo),
  ]);
  return {
    masterChannel,
    metaInfoChannelRoot,
    metaInfoChannel,
    iota,
    metaInfoRootBundle,
    metaInfoBundle,
  };
}

export async function createMasterChannel(
  iota: API,
  seed: string,
  capacity: number,
) {
  const masterChannel = await RAAM.fromSeed(getMasterSeed(seed, capacity), {
    amount: capacity,
    iota,
    security: 1,
  });
  log.debug('Vehicle channel created');
  return masterChannel;
}

export async function publishMetaInfoRoot(
  masterChannel: RAAM,
  root: string,
): Promise<{ metaInfoRootBundle: Hash; masterChannel: RAAM }> {
  const metaInfoRootBundle = await masterChannel.publish(root);
  log.debug('Published metaInfo root.');
  log.silly('Bundle: \'%s\'', metaInfoRootBundle);
  return { metaInfoRootBundle, masterChannel };
}

async function publishMetaInfo(
  writer: MamWriter,
  info: VehicleInfo,
): Promise<string> {
  const txs = await writer.createAndAttach(JSON.stringify({ put: info }));
  const result = txs[0].bundle;
  log.debug('Published metaInfo.');
  log.silly('Bundle: \'%s\'', result);
  return result;
}

function createMetaInfoWriter(provider: string, seed: string) {
  const metaInfoSeed = getMetaInfoSeed(seed);
  const infoChannel = new MamWriter(provider, metaInfoSeed, MAM_MODE.PUBLIC);
  Object.assign(infoChannel, {
    // dirty hack. mam.ts supports powsrv only with api_key
    attachFunction: createAttachToTangle(provider),
  });
  return infoChannel;
}
