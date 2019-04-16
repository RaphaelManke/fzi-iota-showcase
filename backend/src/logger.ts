import { log } from 'fzi-iota-showcase-client';
import { SafeEmitter, Event } from './events';
import { Trytes } from '@iota/core/typings/types';

export function enableLogging(
  events: SafeEmitter,
  isUser: (id: Trytes) => boolean,
) {
  const prettify = (type: Type, data: any) => {
    let format: { skip: string; entity: string };
    switch (type[1]) {
      case 'Login':
      case 'Logout':
        format = { skip: 'id', entity: 'User' };
        break;
      case 'TransactionIssued':
        format = {
          skip: 'from',
          entity: isUser(data.from) ? 'User' : 'Vehicle',
        };
        break;
      case 'PosUpdated':
        format = { skip: 'id', entity: 'Vehicle' };
        break;
      case 'ReachedStop':
      case 'CheckIn':
        format = { skip: 'vehicleId', entity: 'Vehicle' };
        break;
      default:
        format = { skip: 'userId', entity: 'User' };
        break;
    }

    const r: any = {};
    if (data) {
      Object.keys(data)
        .filter((p) => p !== format.skip)
        .forEach((p) => {
          let v = data[p];
          if (typeof v === 'number') {
            v = Math.round(v * 100) / 100;
          }
          r[p] = v;
        });
      const entityLabel = format.entity + ' ' + data[format.skip];
      const typePadding =
        entityLabel.length < 11 ? ' '.repeat(11 - entityLabel.length) : '';
      const prefix = `${entityLabel}${typePadding} ${type[1]}`;

      if (Object.keys(r).length > 0) {
        // const padding =
        //   prefix.length < 30 ? ' '.repeat(30 - prefix.length) : '';
        log.debug(`${prefix}:\n%o`, r);
      } else {
        log.debug(prefix);
      }
    } else {
      log.debug(type.join('.'));
    }
  };

  events.onAny((type: any, data: any) => prettify(type, data));
}

type Type = ['public', Event[0]];
