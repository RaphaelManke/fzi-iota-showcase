import { log } from 'fzi-iota-showcase-client';
import { SafeEmitter } from './events';

export function enableLogging(events: SafeEmitter) {
  const prettify = (type: string[], data: any) => {
    const skip = 'id';
    const r: any = {};
    if (data) {
      Object.keys(data)
        .filter((p) => p !== skip)
        .forEach((p) => {
          let v = data[p];
          if (typeof v === 'number') {
            v = Math.round(v * 100) / 100;
          }
          r[p] = v;
        });
      const name = type[1].startsWith('markerAdded') ? 'Mrk.' : 'Veh.';
      const typePadding = !data.id || data.id.length < 10 ? ' '.repeat(10 - (data.id ? data.id.length : 0)) : '';
      const prefix = `${name} ${data.id}${typePadding} ${type[1]}`;

      if (Object.keys(r).length > 0) {
        const padding = prefix.length < 30 ? ' '.repeat(30 - prefix.length) : '';
        log.debug(`${prefix}:${padding}  %o`, r);
      } else {
        log.debug(prefix);
      }
    } else {
      log.debug(type.join('.'));
    }
  };

  events.onAny((type: any, data: any) => prettify(type, data));
}
