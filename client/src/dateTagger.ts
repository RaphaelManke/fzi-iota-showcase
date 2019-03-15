import { Tag } from '@iota/core/typings/types';

export function getDateTag(date: Date = new Date()): Tag {
  const pad = (t: string, size: number) => new Array(size).fill('9')
    .map((e, i) => size - i > t.length ? e : t.charAt(i - (size - t.length))).join('');

  const trytes = pad(intToTrytes(date.getDate()), 2)
    + pad(intToTrytes(date.getMonth()), 1)
    + pad(intToTrytes(date.getFullYear()), 3);
  return pad(trytes, 27);
}

const alphabet = '9ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function intToTrytes(input: number) {
  if (input === 0) {
    return alphabet[0];
  }
  let v = input;
  const result = [];
  while (v > 0) {
    const b = v % 27;
    v = Math.floor(v / 27);
    result.unshift(alphabet[b]);
  }
  return result.reduce((acc, tryte) => acc.concat(tryte), '');
}
