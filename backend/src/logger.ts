import { log, trytesToInt } from 'fzi-iota-showcase-client';
import { SafeEmitter, Event } from './events';
import { Trytes } from '@iota/core/typings/types';
import * as colors from 'colors';

const skipAlways = ['allowedDestinations'];

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
      case 'PaymentIssued':
        format = {
          skip: 'from',
          entity: isUser(data.from) ? 'User' : 'Vehicle',
        };
        break;
      case 'TransactionIssued':
        format =
          data.type === 'value'
            ? {
                skip: 'from',
                entity: isUser(data.from) ? 'User' : 'Vehicle',
              }
            : {
                skip: 'vehicle',
                entity: 'Vehicle',
              };
        break;
      case 'PosUpdated':
        format = { skip: 'id', entity: 'Vehicle' };
        break;
      case 'ReachedStop':
      case 'CheckIn':
      case 'Departed':
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
        .filter((p) => skipAlways.find((s) => s === p) === undefined)
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
      const prefix = `${colorText(entityLabel)}${typePadding} ${colorBg(
        type[1],
      )}`;

      if (Object.keys(r).length > 0) {
        // const padding =
        //   prefix.length < 30 ? ' '.repeat(30 - prefix.length) : '';
        log[getLevel(type[1], data)](`${prefix}:\n%o`, r);
      } else {
        log[getLevel(type[1], data)](prefix);
      }
    } else {
      log[getLevel(type[1], data)](type.join('.'));
    }
  };

  events.onAny((type: any, data: any) => prettify(type, data));
}

function colorText(s: string) {
  const id = s.split(' ')[1];
  const i = trytesToInt(id) % text.length;
  try {
    return text[i](s);
  } catch (e) {
    return s;
  }
}

const text = [
  colors.red,
  colors.green,
  colors.yellow,
  colors.blue,
  colors.magenta,
  colors.cyan,
  colors.white,
  colors.gray,
];

const bgs = new Map<Event[0], colors.Color>();
bgs.set('Login', colors.bgMagenta);
bgs.set('ReachedStop', colors.bgYellow);
bgs.set('Departed', colors.bgCyan);
bgs.set('CheckIn', colors.bgWhite);
bgs.set('BoardingStarted', colors.bgBlue);
bgs.set('BoardingCancelled', colors.bgRed);
bgs.set('PaymentIssued', colors.bgCyan);
bgs.set('TripStarted', colors.bgGreen);
bgs.set('TripFinished', colors.bgRed);
bgs.set('Logout', colors.bgRed);
bgs.set('PosUpdated', colors.bgWhite);
bgs.set('ReservationIssued', colors.bgGreen);
bgs.set('ReservationExpired', colors.bgYellow);
bgs.set('TransactionIssued', colors.bgMagenta);

function colorBg(s: Event[0]) {
  if (!bgs.has(s)) {
    bgs.set(s, bg[bgs.size % bg.length]);
  }
  try {
    return bgs.get(s)!(s.black);
  } catch (e) {
    return s;
  }
}

const bg = [
  colors.bgRed,
  colors.bgGreen,
  colors.bgMagenta,
  colors.bgYellow,
  colors.bgBlue,
  colors.bgCyan,
  colors.bgWhite,
];

function getLevel(eventType: Event[0], data: any) {
  switch (eventType) {
    case 'TransactionIssued':
      return data.type === 'value' ? 'debug' : 'silly';
    case 'PosUpdated':
      return 'silly';
    default:
      return 'debug';
  }
}

type Type = ['public', Event[0]];
