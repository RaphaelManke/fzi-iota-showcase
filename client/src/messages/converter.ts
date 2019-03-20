import { Trytes } from '@iota/core/typings/types';
import { trytesToAscii, asciiToTrytes, trytes, trits } from '@iota/converter';

export function fromTrytes(input: Trytes, ...maps: Array<[string, 'trits' | 'date']>) {
  return JSON.parse(trytesToAscii(input), (key, value) => {
    const pair = maps.find(([p, t]) => key === p);
    if (pair) {
      switch (pair[1]) {
        case 'trits': return trits(value);
        case 'date': return new Date(value);
      }
    }
    return value;
  });
}

export function toTrytes(input: any): Trytes {
  return asciiToTrytes(JSON.stringify(input,
    (key, value) => value instanceof Int8Array ? trytes(value) : value));
}
