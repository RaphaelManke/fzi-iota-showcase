import { explode } from './explode';
import { trits, trytes, fromValue } from '@iota/converter';
import { add } from '@iota/signing';
import Kerl from '@iota/kerl';
import { BigNumber } from 'bignumber.js';

const MAX_VALUE = new BigNumber(value(trits('M'.repeat(81))));
const DEFAULT_MAM_TREE_SIZE = 1;

export const TRIP_CHANNEL_CAPACITY = 2;
export let checkedMetaInfoCapacity = DEFAULT_MAM_TREE_SIZE * 500;
export let checkedReservationCapacity = DEFAULT_MAM_TREE_SIZE * 1000;

export function getTripSeed(seed: string, index: number) {
  return trytes(getTripSeedTrits(seed, index));
}

export function getReservationSeed(seed: string, tripIndex: number) {
  return trytes(
    hashUntilCapacity(
      explode(getTripSeedTrits(seed, tripIndex)),
      checkedReservationCapacity,
    ),
  );
}

export function getMetaInfoSeed(seed: string) {
  return trytes(
    hashUntilCapacity(explodeWithIndex(seed, 0), checkedMetaInfoCapacity),
  );
}

export function getMasterSeed(seed: string, capacity: number) {
  return trytes(hashUntilCapacity(trits(seed), capacity));
}

export function getPaymentSeed(seed: string) {
  return explodeWithIndex(seed, -1);
}

function getTripSeedTrits(seed: string, index: number) {
  return hashUntilCapacity(
    explodeWithIndex(seed, index),
    TRIP_CHANNEL_CAPACITY,
  );
}

function explodeWithIndex(seed: string, index: number) {
  return explode(add(trits(seed), fromValue(index)));
}

function hashUntilCapacity(seed: Int8Array, capacity: number) {
  const result = new Int8Array(seed);
  const kerl = new Kerl();
  kerl.initialize();
  while (MAX_VALUE.minus(value(result)).lt(capacity)) {
    kerl.absorb(result, 0, Kerl.HASH_LENGTH);
    kerl.squeeze(result, 0, Kerl.HASH_LENGTH);
  }
  return result;
}

function value(input: Int8Array) {
  let returnValue = new BigNumber(0);

  for (let i = input.length; i-- > 0; ) {
    returnValue = returnValue.times(3).plus(input[i]);
  }

  return returnValue;
}
