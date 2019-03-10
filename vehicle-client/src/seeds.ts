import {explode} from './explode';
import {trits, trytes, fromValue} from '@iota/converter';
import {add} from '@iota/signing';

export function getTripSeed(seed: string, index: number) {
  return trytes(explodeWithIndex(seed, index));
}

function explodeWithIndex(seed: string, index: number) {
  return explode(add(trits(seed), fromValue(index)));
}

export function getReservationSeed(seed: string, tripIndex: number) {
  return explode(explodeWithIndex(seed, tripIndex));
}

export function getMetaInfoSeed(seed: string) {
  return getTripSeed(seed, 0);
}
