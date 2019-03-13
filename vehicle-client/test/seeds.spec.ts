import {getMasterSeed, getMetaInfoSeed, getReservationSeed, getTripSeed} from '../src/seeds';
import {log} from 'fzi-iota-showcase-client';
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
    const hashes = seeds.map((s) => hash(s));
    hashes.forEach((h) => set.add(h));
    expect(set.size).equals(seeds.length * 2);
    const hashedHashes = hashes.map((h) => hash(h));
    hashedHashes.forEach((h) => set.add(h));
    expect(set.size).equals(seeds.length * 3);
  });

  it('should create non colliding subseed when seed has equal parts', () => {
    const seed = '9'.repeat(81);
    const collisions = [seed, hash(seed), hash(hash(seed))];
    const set = new Set(collisions);
    const meta = getMetaInfoSeed(seed);
    set.add(meta);
    expect(set.size).to.equal(4);
    set.add(hash(meta));
    expect(set.size).to.equal(5);
    set.add(hash(hash(meta)));
    expect(set.size).to.equal(6);
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
