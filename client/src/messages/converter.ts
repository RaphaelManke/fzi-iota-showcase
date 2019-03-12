import { Trytes } from '@iota/core/typings/types';
import { trytesToAscii, asciiToTrytes, trytes, trits } from '@iota/converter';

export function fromTrytes(input: Trytes, ...convertToTrits: string[]) {
  return JSON.parse(trytesToAscii(input), (key, value) => convertToTrits.indexOf(key) >= 0 ? trits(value) : value);
}

export function toTrytes(input: any): Trytes {
  return asciiToTrytes(JSON.stringify(input,
    (key, value) => value instanceof Int8Array ? trytes(value) : value));
}
