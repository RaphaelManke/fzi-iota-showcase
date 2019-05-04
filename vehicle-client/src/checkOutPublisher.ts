import { RAAM } from 'raam.client.js';
import { log } from 'fzi-iota-showcase-client';

export async function publishCheckOutMessage(
  tripChannel: RAAM,
  { depth = 3, mwm = 14 }: { depth: number; mwm: number } = {
    depth: 3,
    mwm: 14,
  },
) {
  const bundle = await tripChannel.publish('', { index: 0, depth, mwm });
  log.debug('Published CheckOutMessage');
  log.silly('Bundle: \'%s\'', bundle[0].bundle);
  return bundle;
}
