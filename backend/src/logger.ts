import { EventEmitter2 } from 'eventemitter2';
import { log } from 'fzi-iota-showcase-client';

export function enableLogging(events: EventEmitter2) {
  const prettify = (type: string, data: any) => {
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
      const name = type.startsWith('markerAdded') ? 'Mrk.' : 'Veh.';
      const typePadding = data.id.length < 10 ? ' '.repeat(10 - data.id.length) : '';
      const prefix = `${name} ${data.id}${typePadding} ${type}`;

      if (Object.keys(r).length > 0) {
        const padding = prefix.length < 30 ? ' '.repeat(30 - prefix.length) : '';
        return prefix + `:${padding} ${JSON.stringify(r)}`;
      } else {
        return prefix;
      }
    } else {
      return type;
    }
  };

  events.onAny((type: any, data: any) => log.debug(prettify(type, data)));
}
