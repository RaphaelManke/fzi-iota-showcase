import { expect } from 'chai';
import 'mocha';
import { Trytes } from '@iota/core/typings/types';
import { Router, Connection } from '../src/router';
import { Position } from '../src/position';
import { log } from 'fzi-iota-showcase-client';

describe('Router', () => {
  it('should calculate routes between three stops', () => {
    const cons: Connection[] = [{
      from: 'A',
      to: 'B',
      type: 'car',
      path: [{
        lat: 0,
        lng: 0,
      }, {
        lat: 4,
        lng: 0,
      }, {
        lat: 8,
        lng: 0,
      }, {
        lat: 10,
        lng: 0,
      }],
    }, {
      from: 'B',
      to: 'C',
      type: 'car',
      path: [{
        lat: 10,
        lng: 0,
      }, {
        lat: 10,
        lng: 5,
      }, {
        lat: 10,
        lng: 10,
      }],
    }];
    const r = new Router(cons);
    let p = r.getRoutes('A', 'B', 'car'); // easy
    let a = expect(p).to.exist;
    log.info('%o', p);

    p = r.getRoutes('A', 'C', 'car');
    a = expect(p).to.exist;
    log.info('%o', p);

    p = r.getRoutes('C', 'A', 'car');
    a = expect(p).to.exist;
    log.info('%o', p);
  });
});
