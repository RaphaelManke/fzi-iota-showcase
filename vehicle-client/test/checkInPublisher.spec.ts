import { publishCheckIn } from '../src/checkInPublisher';
import { publishReservation } from '../src/reservationPublisher';
import { publishCheckOutMessage } from '../src/checkOutPublisher';
import {
  log,
  CheckInMessage,
  readCheckIns,
  readTripFromMasterChannel,
  readDeparted,
  readReservations,
} from 'fzi-iota-showcase-client';
import { composeAPIOrSkip } from './iota';
import { API } from '@iota/core';
import { trytes } from '@iota/converter';
import { RAAM } from 'raam.client.js';
import { expect, use } from 'chai';
import * as chaiThings from 'chai-things';
import 'mocha';
import { Trytes } from '@iota/core/typings/types';
use(chaiThings);

describe('CheckInPublisher', () => {
  let iota: API;
  let provider: string;

  // making several calls to a full node may take time
  const TIMEOUT = 90000;

  before(async function() {
    ({ iota, provider } = await composeAPIOrSkip(
      this,
      'https://nodes.devnet.iota.org',
      'https://nodes.thetangle.org',
    ));
  });

  it('should publish a check in on the tangle', async function() {
    this.timeout(TIMEOUT);

    return testTrip();
  });

  async function testTrip(password?: Trytes) {
    const {
      message,
      address,
      raam,
      reservationChannel,
      tripChannel,
      welcomeMessage,
    } = await checkIn(password);

    let a: Chai.Assertion;
    a = expect(reservationChannel).to.exist;
    a = expect(tripChannel).to.exist;
    a = expect(welcomeMessage.checkInMessageRef).to.exist;

    const expected = {
      txHash: welcomeMessage.checkInMessageRef,
      message,
    };
    log.info('Expected: %O', {
      txHash: expected.txHash,
      message: {
        ...expected.message,
        vehicleId: trytes(expected.message.vehicleId),
      },
    });
    const txs = await readCheckIns(iota, address, new Date());
    log.info('Found: %O', txs);
    a = expect(txs).to.exist;
    expect(txs.length).gte(1);
    txs
      .map((tx) => ({ txHash: tx.txHash, message: tx.message }))
      .should.contain.an.item.that.deep.equals(expected);

    const result = await readTripFromMasterChannel(
      raam,
      expected.message.tripChannelIndex,
    );
    a = expect(result).to.exist;
    a = expect(result.departed).to.exist;
    a = expect(result.welcomeMessage).to.exist;
    a = expect(result.departed).to.be.false;
    expect(result.welcomeMessage).to.deep.equal(welcomeMessage);
    expect(result.welcomeMessage.checkInMessageRef).to.equal(expected.txHash);
    expect(result.welcomeMessage.tripChannelId).to.deep.equal(
      tripChannel.channelRoot,
    );

    const departed = await readDeparted(welcomeMessage, iota);
    a = expect(departed).to.exist;
    a = expect(departed).to.be.false;
  }

  it('should publish a reservation and read it from the tangle', async function() {
    this.timeout(TIMEOUT);

    const { message: checkInMessage, reservationChannel } = await checkIn();

    const message = {
      expireDate: new Date(),
      hashedNonce: '9',
    };
    await publishReservation(reservationChannel, message);

    const a = expect(checkInMessage.reservationRoot).to.exist;
    if (checkInMessage.reservationRoot) {
      const reservations = await readReservations(
        provider,
        checkInMessage!.reservationRoot,
      );
      expect(reservations).to.deep.equal([message]);
    }
  });

  it('should publish the goodbye message and read it from the tangle', async function() {
    this.timeout(TIMEOUT);

    const { tripChannel, welcomeMessage } = await checkIn();

    await publishCheckOutMessage(tripChannel);

    const departed = await readDeparted(welcomeMessage, iota);
    let a = expect(departed).to.exist;
    a = expect(departed).to.be.true;
  });

  it('should publish a WelcomeMessage encrypted with a password given in the ceckInMessage', async function() {
    this.timeout(TIMEOUT);

    return testTrip('MYPASSWORD');
  });

  async function checkIn(password?: Trytes) {
    const seed = generateSeed();
    log.info('Seed: %s', seed);
    const raam = await RAAM.fromSeed(seed, { amount: 2, iota });
    log.info('MasterChannel id: %s', trytes(raam.channelRoot));
    const address = generateSeed();
    log.info('Stop address: %s', address);
    const message: CheckInMessage = {
      hashedNonce: 'A'.repeat(81),
      paymentAddress: '9'.repeat(81),
      price: 4000000,
      reservationRate: 400000,
      tripChannelIndex: 1,
      vehicleId: raam.channelRoot,
    };
    if (password) {
      message.password = password;
    }
    return {
      message,
      address,
      raam,
      ...(await publishCheckIn(provider, seed, raam, address, message)),
    };
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
