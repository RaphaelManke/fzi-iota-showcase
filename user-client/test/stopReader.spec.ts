import { queryStop, Offer } from '../src/stopReader';
import { publishCheckIn, publishVehicle, publishReservation,
  publishCheckOutMessage } from 'fzi-iota-showcase-vehicle-client';
import { log, CheckInMessage, VehicleInfo } from 'fzi-iota-showcase-client';
import { API } from '@iota/core';
import { trytes } from '@iota/converter';
import { Trytes, Hash } from '@iota/core/typings/types';
import { RAAM } from 'raam.client.js';

import { composeAPIOrSkip } from './iota';
import { expect, use } from 'chai';
import * as chaiThings from 'chai-things';
import 'mocha';
use(chaiThings);

describe('StopReader', () => {
  let iota: API;
  let provider: string;

  // making several calls to a full node may take time
  const TIMEOUT = 90000;

  before(async function() {
    ({iota, provider} = await composeAPIOrSkip(this, // 'https://nodes.devnet.iota.org',
      'https://nodes.thetangle.org'));
  });

  it('should read all checkIns from a stop', async function() {
    this.timeout(TIMEOUT);

    const {message, address, masterChannel, info, reservationChannel, tripChannel, welcomeMessage} = await checkIn();

    let calledBack = false;
    const offers = await queryStop(provider, iota, address, {callback: (o) => {
      log.info('%O', {
        ...o,
        vehicleId: o.vehicleId ? trytes(o.vehicleId) : undefined,
      });
      calledBack = true;
    }});

    let a = expect(calledBack).to.be.true;
    expect(offers.length).to.be.gte(1);
    const [offer] = offers;
    checkOffer(offer, masterChannel, info, address, message);
    a = expect(offer.trip.reservations).to.be.empty;
  });

  function checkOffer(offer: Offer, masterChannel: RAAM, info: VehicleInfo, address: Hash, message: CheckInMessage) {
    let a = expect(offer).to.exist;
    a = expect(offer.vehicleId).to.exist;
    a = expect(offer.vehicleInfo).to.exist;
    expect(offer.vehicleId).to.deep.equal(masterChannel.channelRoot);
    expect(offer.vehicleInfo).to.deep.equal(info);

    a = expect(offer.trip).to.exist;
    const {trip} = offer;
    a = expect(trip.departed).to.be.false;
    expect(trip.departsFrom).to.equal(address);
    expect(trip.paymentAddress).to.equal(message.paymentAddress);
    expect(trip.price).to.equal(message.price);
    expect(trip.reservationRate).to.equal(message.reservationRate);
  }

  it('should read a reserved CheckIn from the tangle', async function() {
    this.timeout(TIMEOUT);

    const {message, address, masterChannel, info, reservationChannel} = await checkIn();

    // reservation that's not expired
    const reservation = { expireDate: new Date(Date.now() + 1000 * 60 * 60), hashedNonce: '9'.repeat(81) };
    await publishReservation(reservationChannel, reservation);

    let calledBack = false;
    const offers = await queryStop(provider, iota, address, {callback: (o) => {
      log.info('%O', {
        ...o,
        vehicleId: o.vehicleId ? trytes(o.vehicleId) : undefined,
      });
      calledBack = true;
    }});

    const a = expect(calledBack).to.be.true;
    expect(offers.length).to.be.gte(1);
    const [offer] = offers;
    checkOffer(offer, masterChannel, info, address, message);
    expect(offer.trip.reservations.length).to.equal(1);
    expect(offer.trip.reservations[0]).to.deep.equal(reservation);
  });

  async function checkIn(password?: Trytes) {
    const seed = generateSeed();
    log.info('Seed: %s', seed);
    log.info('Creating vehicle...');
    const info = {type: 'car'};
    const { masterChannel } = await publishVehicle(provider, seed, 4, info, iota);
    log.info('MasterChannel id: %s', trytes(masterChannel.channelRoot));
    const address = generateSeed();
    log.info('Stop address: %s', address);
    const message: CheckInMessage = {
      paymentAddress: '9'.repeat(81),
      price: 4000000,
      reservationRate: 400000,
      tripChannelIndex: 1,
      vehicleId: masterChannel.channelRoot,
    };
    log.info('Publishing checkIn...');
    return {message, address, masterChannel, info,
      ...await publishCheckIn(provider, seed, masterChannel, address, message)};
  }
});

function generateSeed(length = 81) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ9';
  const retVal = [];
  for (let i = 0, n = charset.length; i < length; ++i) {
      retVal[i] = charset.charAt(Math.floor(Math.random() * n));
  }
  const result = retVal.join('');
  return result;
}
