import { log } from './logger';
import { buildObject } from './chainedMessageBuilder';
import { MamReader } from 'mam.ts';
import { RAAMReader } from 'raam.client.js';
import { API, composeAPI } from '@iota/core';
import { Vehicle, VehicleInfo } from './vehicle';

async function readMetaInfoStream(
  provider: string,
  channelRoot: string,
): Promise<VehicleInfo> {
  const reader = new MamReader(provider, channelRoot);
  const messages = await reader.fetch();
  log.debug('Read metaInfo: %O', messages);
  return buildObject(messages.map((s) => JSON.parse(s)));
}

export async function readVehicleInfo(
  provider: string,
  vehicleId: Int8Array,
  iota: API = composeAPI({ provider }),
) {
  const { message: root } = await RAAMReader.fetchSingle(iota, vehicleId, 0);
  log.debug('Read meta info root: %s', root);
  if (root) {
    return await readMetaInfoStream(provider, root);
  } else {
    return undefined;
  }
}

export async function readVehicle(
  provider: string,
  vehicleId: Int8Array,
  iota: API = composeAPI({ provider }),
) {
  const masterChannel = new RAAMReader(vehicleId, { iota });
  const {
    messages: [root],
  } = await masterChannel.fetch({ index: 0 });
  log.debug('Read meta info root: %s', root);

  if (root) {
    const [vehicleInfo, { messages: trips }] = await Promise.all([
      readMetaInfoStream(provider, root),
      masterChannel.syncChannel(),
    ]);
    return new Vehicle(vehicleId, vehicleInfo);
  } else {
    return undefined;
  }
}
