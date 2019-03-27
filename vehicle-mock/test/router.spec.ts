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
    let p = r.getPath('A', 'B', 'car'); // easy
    let a = expect(p).to.exist;
    log.info('%O', p);

    p = r.getPath('A', 'C', 'car');
    a = expect(p).to.exist;
    log.info('%O', p);

    p = r.getPath('C', 'A', 'car');
    a = expect(p).to.exist;
    log.info('%O', p);
  });
});
