import { Tag } from '@iota/core/typings/types';
import { intToPaddedTrytes, pad } from './intTryteConverter';

export function getDateTag(date: Date = new Date()): Tag {
  const trytes = intToPaddedTrytes(date.getDate(), 2)
    + intToPaddedTrytes(date.getMonth(), 1)
    + intToPaddedTrytes(date.getFullYear(), 3);
  return pad(trytes, 27);
}
