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
  { depth = 3, mwm = 14 }: { depth: number; mwm: number } = {
    depth: 3,
    mwm: 14,
  },
): Promise<{ root: Hash; bundle: string }> {
  const infoChannel = await createMetaInfoWriter(provider, seed);
  await infoChannel.catchUpThroughNetwork();
  const root: Hash = infoChannel.getNextRoot();
  return {
    root,
    bundle: await publishMetaInfo(infoChannel, info, { depth, mwm }),
  };
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
  { depth = 3, mwm = 14 }: { depth: number; mwm: number } = {
    depth: 3,
    mwm: 14,
  },
): Promise<{
  masterChannel: RAAM;
  metaInfoChannelRoot: Hash;
  metaInfoChannel: MamWriter;
  metaInfoRootBundle: Transaction[];
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
      publishMetaInfoRoot(channel, metaInfoChannelRoot, { depth, mwm }),
    ),
    publishMetaInfo(metaInfoChannel, vehicleInfo, { depth, mwm }),
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
  { depth = 3, mwm = 14 }: { depth: number; mwm: number } = {
    depth: 3,
    mwm: 14,
  },
): Promise<{ metaInfoRootBundle: Transaction[]; masterChannel: RAAM }> {
  const metaInfoRootBundle = await masterChannel.publish(root, { depth, mwm });
  log.debug('Published metaInfo root.');
  log.silly('Bundle: \'%s\'', metaInfoRootBundle[0].bundle);
  return { metaInfoRootBundle, masterChannel };
}

async function publishMetaInfo(
  writer: MamWriter,
  info: VehicleInfo,
  { depth = 3, mwm = 14 }: { depth: number; mwm: number } = {
    depth: 3,
    mwm: 14,
  },
): Promise<string> {
  const msg = writer.create(JSON.stringify({ put: info }));
  const txs = await writer.attach(msg.payload, msg.address, depth, mwm);
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
