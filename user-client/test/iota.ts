import { composeAPI } from '@iota/core';
import { createAttachToTangle, log } from 'fzi-iota-showcase-client';
import 'mocha';

export async function composeAPIOrSkip(
  hook: Mocha.Context,
  ...providers: string[]
) {
  for (const provider of providers) {
    const iota = composeAPI({
      provider,
      attachToTangle: createAttachToTangle(provider),
    });
    try {
      await iota.getNodeInfo();
      return { iota, provider };
    } catch (e) {
      log.warn(`IOTA Node '${provider}' isn't available`);
    }
  }
  log.warn('No node is available, skip this tests');
  hook.skip();
  return { iota: composeAPI(), provider: '' };
}
