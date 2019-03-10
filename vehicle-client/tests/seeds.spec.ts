import {getMasterSeed, getMetaInfoSeed, getReservationSeed, getTripSeed} from '../src/seeds';
import {Logger} from 'fzi-iota-showcase-client';
const {log} = Logger;
import Kerl from '@iota/kerl';
import { trits, trytes } from '@iota/converter';

import {use, should, expect} from 'chai';
import * as chaiThings from 'chai-things';
should();
use(chaiThings);
import 'mocha';


describe('Seed management', () => {
  it('should create subseeds from a seed that don\'t collide', async function() {
    this.timeout(2000);
    const seed = 'ERTZUHKJHGFDSFRETZUKJGHFDSDFVDBHTFZUJHGNFBDSRTHZJUJGHFBDVSCSDXFGHKUZTZTGFDSVBN999';
    const seeds = [];
    seeds.push(getMasterSeed(seed, 1000));
    seeds.push(getMetaInfoSeed(seed));
    seeds.push(getTripSeed(seed, 1));
    seeds.push(getTripSeed(seed, 2));
    seeds.push(getReservationSeed(seed, 1));
    seeds.push(getReservationSeed(seed, 2));
    const set = new Set(seeds);
    log.info('Seeds:\n%O', seeds);
    expect(seeds.length).equals(set.size);
    seeds.should.all.not.satisfy((e: string) => set.has(hash(e)));
    seeds.should.all.not.satisfy((e: string) => set.has(hash(hash(e))));
  });
});

function hash(x: string) {
  const kerl = new Kerl();
  kerl.initialize();
  const buffer = trits(x);
  kerl.absorb(buffer, 0, buffer.length);
  kerl.squeeze(buffer, 0, Kerl.HASH_LENGTH);
  return trytes(buffer);
}
