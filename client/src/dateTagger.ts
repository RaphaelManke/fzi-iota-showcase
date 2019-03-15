import { Tag } from '@iota/core/typings/types';
import {intToTrytes} from './intTryteConverter';

export function getDateTag(date: Date = new Date()): Tag {
  const pad = (t: string, size: number) => new Array(size).fill('9')
    .map((e, i) => size - i > t.length ? e : t.charAt(i - (size - t.length))).join('');

  const trytes = pad(intToTrytes(date.getDate()), 2)
    + pad(intToTrytes(date.getMonth()), 1)
    + pad(intToTrytes(date.getFullYear()), 3);
  return pad(trytes, 27);
}
