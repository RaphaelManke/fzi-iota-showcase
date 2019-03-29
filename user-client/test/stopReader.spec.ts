import { queryStop, Offer } from '../src/stopReader';
import {
  publishCheckIn,
  publishVehicle,
  publishReservation,
  publishCheckOutMessage,
} from 'fzi-iota-showcase-vehicle-client';
import {
  log,
  CheckInMessage,
  VehicleInfo,
  toTrytes,
  intToPaddedTrytes,
  getDateTag,
} from 'fzi-iota-showcase-client';
import { API } from '@iota/core';
import { trytes } from '@iota/converter';
import { Hash } from '@iota/core/typings/types';
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
  const TIMEOUT = 180000;

  before(async function() {
    ({ iota, provider } = await composeAPIOrSkip(
      this,
      'https://nodes.devnet.iota.org',
      'https://nodes.thetangle.org',
    ));
  });

  it('should read all CheckIns from a stop', async function() {
    this.timeout(TIMEOUT);

    const { message, address, masterChannel, info } = await doCheckIn();

    let calledBack = false;
    const offers = await queryStop(provider, iota, address, {
      callback: (o) => {
        log.info('%O', {
          ...o,
          vehicleId: o.vehicleId ? trytes(o.vehicleId) : undefined,
        });
        calledBack = true;
      },
    });

    let a = expect(calledBack).to.be.true;
    expect(offers.length).to.be.gte(1);
    const [offer] = offers;
    a = expect(offer.vehicleInfo).to.exist;
    expect(offer.vehicleInfo).to.deep.equal(info);
    checkOffer(offer, masterChannel, address, message);
    a = expect(offer.trip.departed).to.be.false;
    a = expect(offer.trip.reservations).to.be.empty;
  });

  it('should read a departed CheckIn from a stop', async function() {
    this.timeout(TIMEOUT);

    const {
      message,
      address,
      masterChannel,
      info,
      tripChannel,
    } = await doCheckIn();

    await publishCheckOutMessage(tripChannel);
    log.info('Published CheckOutMessage');

    let calledBack = false;
    const offers = await queryStop(provider, iota, address, {
      callback: (o) => {
        calledBack = true;
      },
    });

    // callback mustn't be called, because vehicle departed from stop
    let a = expect(calledBack).to.be.false;
    expect(offers.length).to.be.gte(1);
    const [offer] = offers;
    log.info('%O', {
      ...offer,
      vehicleId: offer.vehicleId ? trytes(offer.vehicleId) : undefined,
    });
    a = expect(offer.vehicleInfo).not.to.exist;
    checkOffer(offer, masterChannel, address, message);
    a = expect(offer.trip.departed).to.be.true;
    a = expect(offer.trip.reservations).to.not.exist;
  });

  it('should read a reserved CheckIn from the tangle', async function() {
    this.timeout(TIMEOUT);

    const {
      message,
      address,
      masterChannel,
      info,
      reservationChannel,
    } = await doCheckIn();

    // reservation that's not expired
    const reservation = {
      expireDate: new Date(Date.now() + 1000 * 60 * 60),
      hashedNonce: '9'.repeat(81),
    };
    await publishReservation(reservationChannel, reservation);
    log.info('Published reservation');

    let calledBack = false;
    const offers = await queryStop(provider, iota, address, {
      callback: (o) => {
        log.info('%O', {
          ...o,
          vehicleId: o.vehicleId ? trytes(o.vehicleId) : undefined,
        });
        calledBack = true;
      },
    });

    let a = expect(calledBack).to.be.true;
    expect(offers.length).to.be.gte(1);
    const [offer] = offers;
    a = expect(offer.vehicleInfo).to.exist;
    expect(offer.vehicleInfo).to.deep.equal(info);
    checkOffer(offer, masterChannel, address, message);
    a = expect(offer.trip.departed).to.be.false;
    a = expect(offer.trip.reservations).to.exist;
    expect(offer.trip.reservations!.length).to.equal(1);
    expect(offer.trip.reservations![0]).to.deep.equal(reservation);
  });

  it('should read a definitly reserved CheckIn from the tangle', async function() {
    this.timeout(TIMEOUT);

    const {
      message,
      address,
      masterChannel,
      info,
      reservationChannel,
    } = await doCheckIn({ info: { type: 'car', maxReservations: 1 } });

    // reservation that's not expired
    const reservation = {
      expireDate: new Date(Date.now() + 1000 * 60 * 60),
      hashedNonce: '9'.repeat(81),
    };
    await publishReservation(reservationChannel, reservation);
    log.info('Published reservation');

    let calledBack = false;
    const offers = await queryStop(provider, iota, address, {
      callback: (o) => {
        calledBack = true;
      },
    });

    // callback mustn't be called because trip is definitly reserved
    let a = expect(calledBack).to.be.false;
    expect(offers.length).to.be.gte(1);
    const [offer] = offers;
    log.info('%O', {
      ...offer,
      vehicleId: offer.vehicleId ? trytes(offer.vehicleId) : undefined,
    });
    a = expect(offer.vehicleInfo).to.exist;
    expect(offer.vehicleInfo).to.deep.equal(info);
    checkOffer(offer, masterChannel, address, message);
    a = expect(offer.trip.departed).to.be.false;
    a = expect(offer.trip.reservations).to.exist;
    expect(offer.trip.reservations!.length).to.equal(1);
    expect(offer.trip.reservations![0]).to.deep.equal(reservation);
  });

  it('should read from a stop with an expired CheckIn', async function() {
    this.timeout(TIMEOUT);

    const { address } = await doCheckIn({
      checkIn: (mc) => ({
        hashedNonce: 'A'.repeat(81),
        paymentAddress: '9'.repeat(81),
        price: 4000000,
        reservationRate: 400000,
        tripChannelIndex: 1,
        vehicleId: mc.channelRoot,
        validUntil: new Date(),
      }),
    });

    let calledBack = false;
    const offers = await queryStop(provider, iota, address, {
      callback: (o) => {
        log.info('%O', {
          ...o,
          vehicleId: o.vehicleId ? trytes(o.vehicleId) : undefined,
        });
        calledBack = true;
      },
    });

    let a = expect(calledBack).to.be.false;
    a = expect(offers).to.be.empty;
  });

  it('should read from a stop with a currently not valid CheckIn', async function() {
    this.timeout(TIMEOUT);

    const { address } = await doCheckIn({
      checkIn: (mc) => ({
        hashedNonce: 'A'.repeat(81),
        paymentAddress: '9'.repeat(81),
        price: 4000000,
        reservationRate: 400000,
        tripChannelIndex: 1,
        vehicleId: mc.channelRoot,
        validFrom: new Date(Date.now() + 1000 * 60 * 60),
      }),
    });

    let calledBack = false;
    const offers = await queryStop(provider, iota, address, {
      callback: (o) => {
        log.info('%O', {
          ...o,
          vehicleId: o.vehicleId ? trytes(o.vehicleId) : undefined,
        });
        calledBack = true;
      },
    });

    let a = expect(calledBack).to.be.false;
    a = expect(offers).to.be.empty;
  });

  it('should read a CheckIn with an expired reservation from a stop', async function() {
    this.timeout(TIMEOUT);

    const {
      message,
      address,
      masterChannel,
      info,
      reservationChannel,
    } = await doCheckIn();

    // reservation that's expired
    const reservation = { expireDate: new Date(), hashedNonce: '9'.repeat(81) };
    await publishReservation(reservationChannel, reservation);
    log.info('Published reservation');

    let calledBack = false;
    const offers = await queryStop(provider, iota, address, {
      callback: (o) => {
        log.info('%O', {
          ...o,
          vehicleId: o.vehicleId ? trytes(o.vehicleId) : undefined,
        });
        calledBack = true;
      },
    });

    let a = expect(calledBack).to.be.true;
    expect(offers.length).to.be.gte(1);
    const [offer] = offers;
    a = expect(offer.vehicleInfo).to.exist;
    expect(offer.vehicleInfo).to.deep.equal(info);
    checkOffer(offer, masterChannel, address, message);
    a = expect(offer.trip.departed).to.be.false;
    a = expect(offer.trip.reservations).to.be.empty;
  });

  it('should read CheckIns from different dates', async function() {
    this.timeout(TIMEOUT + 30000);

    const now = Date.now();
    log.info('Publish CheckIn 1...');
    const { message, address, masterChannel, info } = await doCheckIn({
      info: { order: 'erster' },
      date: new Date(now - 24 * 60 * 60 * 1000),
    });

    log.info('Publish CheckIn 2...');
    const { message: m2, masterChannel: mc2, info: i2 } = await doCheckIn({
      info: { order: 'zweiter' },
      address,
    });

    let calledBack = 0;
    const offers = await queryStop(provider, iota, address, {
      callback: (o) => {
        calledBack++;
      },
      dates: [
        new Date(now),
        new Date(now - 24 * 60 * 60 * 1000),
        new Date(/* if now is now yesterday ;) */),
      ],
    });

    let a = expect(calledBack).to.be.gte(2);
    expect(offers.length).to.be.gte(2);
    log.info('Offer:');
    offers.forEach((o, i) =>
      log.info('%s %O', i, {
        ...o,
        vehicleId: o.vehicleId ? trytes(o.vehicleId) : undefined,
      }),
    );

    const check = (
      offer: Offer,
      mc: RAAM,
      m: CheckInMessage,
      i: VehicleInfo,
    ) => {
      a = expect(offer.vehicleInfo).to.exist;
      expect(offer.vehicleInfo).to.deep.equal(i);
      expect(offer.trip.hashedNonce).to.equal(m.hashedNonce);
      checkOffer(offer, mc, address, m);
      a = expect(offer.trip.departed).to.be.false;
      a = expect(offer.trip.reservations).to.be.empty;
    };
    check(offers[0], mc2, m2, i2); // last published message should be first
    check(offers[1], masterChannel, message, info);
  });

  it('should read CheckIns with one forged CheckIns', async function() {
    this.timeout(TIMEOUT + 30000);

    const now = Date.now();
    log.info('Publish CheckIn 1...');
    const { message, address, masterChannel, info } = await doCheckIn({
      info: { order: 'erster' },
      date: new Date(now - 24 * 60 * 60 * 1000),
    });

    // anybody could publish this message
    const forged: CheckInMessage = {
      hashedNonce: message.hashedNonce,
      vehicleId: message.vehicleId,
      tripChannelIndex: message.tripChannelIndex,
      paymentAddress: 'MYADDRESS',
      price: 9000000,
      reservationRate: 900000,
      vehicleInfo: { type: 'car', identity: 'forged' },
      reservationRoot: generateSeed(),
    };
    log.info('Publishing forged checkIn message...');
    await publishCheckInMessage(address, forged);

    const offers = await queryStop(provider, iota, address);

    expect(offers.length).to.be.gte(2);
    log.info('Offer:');
    offers.forEach((o, i) =>
      log.info('%s %O', i, {
        ...o,
        vehicleId: o.vehicleId ? trytes(o.vehicleId) : undefined,
      }),
    );

    let a: Chai.Assertion;
    const check = (
      offer: Offer,
      mc: RAAM | undefined,
      m: CheckInMessage,
      i: VehicleInfo,
    ) => {
      a = expect(offer.vehicleInfo).to.exist;
      expect(offer.vehicleInfo).to.deep.equal(i);
      checkOffer(offer, mc, address, m);
      a = expect(offer.trip.reservations).to.be.empty;
    };
    check(offers[1], masterChannel, message, info);
    a = expect(offers[1].trip.departed).to.be.false;
    check(offers[0], undefined, forged, forged.vehicleInfo!);
    a = expect(offers[0].trip.departed).to.not.exist;
  });

  async function publishCheckInMessage(
    address: Hash,
    checkInMessage: CheckInMessage,
  ) {
    const trytesMessage = toTrytes(checkInMessage);
    const message = intToPaddedTrytes(trytesMessage.length, 3) + trytesMessage;
    const transfers = [
      {
        address,
        message,
        tag: getDateTag(),
        value: 0,
      },
    ];
    const t = await iota.prepareTransfers('9'.repeat(81), transfers);
    const result = await iota.sendTrytes(t, 3, 14);
    log.debug('Published CheckInMessage');
    return result;
  }

  async function doCheckIn(
    {
      date = new Date(),
      info = { type: 'car' },
      checkIn = checkInFunc,
      address = generateSeed(),
    }: {
      date?: Date;
      info?: VehicleInfo;
      checkIn?: (masterChannel: RAAM) => CheckInMessage;
      address?: Hash;
    } = {
      date: new Date(),
      info: { type: 'car' },
      checkIn: checkInFunc,
      address: generateSeed(),
    },
  ) {
    const seed = generateSeed();
    log.info('Seed: %s', seed);
    log.info('Creating vehicle...');
    const { masterChannel } = await publishVehicle(
      provider,
      seed,
      4,
      info,
      iota,
    );
    log.info('MasterChannel id: %s', trytes(masterChannel.channelRoot));
    log.info('Stop address: %s', address);
    const message: CheckInMessage = checkIn(masterChannel);
    log.info('Publishing checkIn...');
    return {
      message,
      address,
      masterChannel,
      info,
      ...(await publishCheckIn(
        provider,
        seed,
        masterChannel,
        address,
        message,
        { date },
      )),
    };
  }
});

function checkOffer(
  offer: Offer,
  masterChannel: RAAM | undefined,
  address: Hash,
  message: CheckInMessage,
) {
  let a = expect(offer).to.exist;
  if (masterChannel) {
    a = expect(offer.vehicleId).to.exist;
    expect(offer.vehicleId).to.deep.equal(masterChannel.channelRoot);
  } else {
    a = expect(offer.vehicleId).to.not.exist;
  }

  a = expect(offer.trip).to.exist;
  const { trip } = offer;
  expect(trip.departsFrom).to.equal(address);
  expect(trip.paymentAddress).to.equal(message.paymentAddress);
  expect(trip.price).to.equal(message.price);
  expect(trip.reservationRate).to.equal(message.reservationRate);
}

const checkInFunc = (masterChannel: RAAM) => ({
  hashedNonce: 'A'.repeat(81),
  paymentAddress: '9'.repeat(81),
  price: 4000000,
  reservationRate: 400000,
  tripChannelIndex: 1,
  vehicleId: masterChannel.channelRoot,
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
