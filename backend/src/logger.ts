import { log } from 'fzi-iota-showcase-client';
import { SafeEmitter, Event } from './events';
import { Trytes } from '@iota/core/typings/types';
import { trits, value } from '@iota/converter';
import * as colors from 'colors';

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
        log[getLevel(type[1])](`${prefix}:\n%o`, r);
      } else {
        log[getLevel(type[1])](prefix);
      }
    } else {
      log[getLevel(type[1])](type.join('.'));
    }
  };

  events.onAny((type: any, data: any) => prettify(type, data));
}

function colorText(s: string) {
  const trit = trits(s.split(' ')[1]);
  return text[value(trit) % text.length](s);
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
  colors.grey,
];

const bgs = new Map<Event[0], colors.Color>();
bgs.set('Login', colors.bgMagenta);
bgs.set('ReachedStop', colors.bgYellow);
bgs.set('Departed', colors.bgCyan);
bgs.set('CheckIn', colors.bgWhite);
bgs.set('BoardingStarted', colors.bgBlue);
bgs.set('PaymentIssued', colors.bgCyan);
bgs.set('TripStarted', colors.bgGreen);
bgs.set('TripFinished', colors.bgRed);
bgs.set('Logout', colors.bgRed);
bgs.set('PosUpdated', colors.bgWhite);
bgs.set('ReservationIssued', colors.bgGreen);
bgs.set('ReservationExpired', colors.bgYellow);

function colorBg(s: Event[0]) {
  if (!bgs.has(s)) {
    bgs.set(s, bg[bgs.size % bg.length]);
  }
  return bgs.get(s)!(s.black);
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

function getLevel(eventType: Event[0]) {
  switch (eventType) {
    case 'PosUpdated':
      return 'silly';
    default:
      return 'debug';
  }
}

type Type = ['public', Event[0]];
