import { Trytes } from '@iota/core/typings/types';

const alphabet = '9ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function pad(t: string, size: number) { 
  return new Array(size).fill('9')
    .map((e, i) => size - i > t.length ? e : t.charAt(i - (size - t.length)))
    .join('');
}

export function intToPaddedTrytes(input: number, length: number) {
  return pad(intToTrytes(input), length);
}

export function intToTrytes(input: number) {
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

export function trytesToInt(trytes: Trytes) {
  let result = 0;
  let factor = 1;
  for (let i = trytes.length - 1; i >= 0; i--) {
    result += alphabet.indexOf(trytes[i]) * factor;
    factor *= 27;
  }
  return result
}
