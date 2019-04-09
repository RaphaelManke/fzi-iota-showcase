import { expect } from 'chai';
import 'mocha';
import { Trytes } from '@iota/core/typings/types';
import { PathFinder, Connection } from '../src/pathFinder';
import { Position } from '../src/position';
import { log } from 'fzi-iota-showcase-client';

describe('PathFinder', () => {
  it('should calculate paths between three stops', () => {
    const cons: Connection[] = [
      {
        from: 'A',
        to: 'B',
        type: 'car',
        path: [
          {
            lat: 0,
            lng: 0,
          },
          {
            lat: 4,
            lng: 0,
          },
          {
            lat: 8,
            lng: 0,
          },
          {
            lat: 10,
            lng: 0,
          },
        ],
      },
      {
        from: 'B',
        to: 'C',
        type: 'car',
        path: [
          {
            lat: 10,
            lng: 0,
          },
          {
            lat: 10,
            lng: 5,
          },
          {
            lat: 10,
            lng: 10,
          },
        ],
      },
    ];
    const r = new PathFinder(cons);
    let p = r.getPaths('A', 'B', ['car']); // easy
    let a = expect(p).to.exist;
    log.info('%o', p);

    p = r.getPaths('A', 'C', ['car']);
    a = expect(p).to.exist;
    log.info('%o', p);

    p = r.getPaths('C', 'A', ['car']);
    a = expect(p).to.exist;
    log.info('%o', p);
  });
});
