import { CheckInMessage } from '../src/messages/checkInMessage';
import { trits, trytesToAscii } from '@iota/converter';
import {log} from '../src/logger';
import { toTrytes } from '../src/messages/converter';
import {expect} from 'chai';

describe('message formatting', () => {
  it('should convert CheckInMessage to and from trytes', () => {
    const m: CheckInMessage = {
      vehicleId: trits('WERGGFD'),
      paymentAddress: 'ASDFGD',
      price: 3.5,
      reservationRate: 2.5,
      tripChannelIndex: 2,
    };
    
    const trytes = toTrytes(m);
    log.info('Trytes: %s', trytes);
    log.info('Ascii: %O', trytesToAscii(trytes));
    const retrieved = CheckInMessage.fromTrytes(trytes);
    expect(retrieved).to.deep.equal(m);
  });
});
