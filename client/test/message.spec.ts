import { CheckInMessage } from '../src/messages/checkInMessage';
import { trits, trytesToAscii } from '@iota/converter';
import { log } from '../src/logger';
import { toTrytes } from '../src/messages/converter';
import { expect } from 'chai';
import { ReservationMessage, StopWelcomeMessage, Reservation } from '../src';
import { Trytes } from '@iota/core/typings/types';
import 'mocha';

describe('message formatting', () => {
  it('should convert CheckInMessage to and from trytes', () => {
    const m: CheckInMessage = {
      hashedNonce: 'A'.repeat(81),
      vehicleId: trits('M'.repeat(81)),
      paymentAddress: 'N'.repeat(81),
      price: 40000000,
      reservationRate: 400000,
      tripChannelIndex: 245,
      reservationRoot: 'Q'.repeat(81),
      password: 'MYFANCYPASSWORD',
      vehicleInfo: {
        type: 'car',
      },
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 1000 * 60 * 60),
    };

    convert(m, CheckInMessage.fromTrytes);
  });

  it('should convert ReservationMessage to and from trytes', () => {
    const m: ReservationMessage = {
      expireDate: new Date('2019-02-03'),
      hashedNonce: 'HASH',
    };

    convert(m, ReservationMessage.fromTrytes);
  });

  it('should convert StopWelcomeMessage to and from trytes', () => {
    const m: StopWelcomeMessage = {
      checkInMessageRef: 'TX',
      tripChannelId: trits('ASDFG'),
    };

    convert(m, StopWelcomeMessage.fromTrytes);
  });

  it('should convert Reservation to and from trytes', () => {
    const m: Reservation = {
      expireDate: new Date('2019-02-02'),
      hashedNonce: 'HAS',
      repaymentAddress: 'SF',
    };

    convert(m, Reservation.fromTrytes);
  });
});

function convert<T>(m: T, fromTrytes: (trytes: Trytes) => T) {
  const trytes = toTrytes(m);
  log.info('Trytes: %s', trytes);
  log.info('Ascii: %O', trytesToAscii(trytes));
  const retrieved = fromTrytes(trytes);
  // log.info('Object: %O', retrieved);
  expect(retrieved).to.deep.equal(m);
}
