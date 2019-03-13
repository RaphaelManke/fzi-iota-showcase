import { MamWriter } from 'mam.ts';
import { ReservationMessage, toTrytes, log } from 'fzi-iota-showcase-client';

export async function publishReservation(reservationChannel: MamWriter, message: ReservationMessage,
                                         {catchUp}: {catchUp: boolean} = {catchUp: true}) {
  if (catchUp) {
    await reservationChannel.catchUpThroughNetwork();
  }
  const txs = await reservationChannel.createAndAttach(toTrytes(message));
  log.debug('Published reservation');
  return txs[0].address;
}
