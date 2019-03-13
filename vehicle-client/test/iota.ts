import { composeAPI, API } from '@iota/core';
import { createAttachToTangle, log } from 'fzi-iota-showcase-client';

export const composeAPIOrSkip = async (hook: Mocha.Context, provider: string) => {
  const iota = composeAPI({
    provider,
    attachToTangle: createAttachToTangle(),
  });
  await iota.getNodeInfo().catch(() => {
    log.warn('IOTA node isn\'t available, skip this tests');
    hook.skip();
  });
  return iota;
}
