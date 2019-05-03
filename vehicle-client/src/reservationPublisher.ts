import { MamWriter } from 'mam.ts';
import { ReservationMessage, toTrytes, log } from 'fzi-iota-showcase-client';

export async function publishReservation(
  reservationChannel: MamWriter,
  message: ReservationMessage,
  {
    catchUp,
    depth = 3,
    mwm = 14,
  }: { catchUp: boolean; depth: number; mwm: number } = {
    catchUp: true,
    depth: 3,
    mwm: 14,
  },
) {
  if (catchUp) {
    await reservationChannel.catchUpThroughNetwork();
  }
  const msg = reservationChannel.create(toTrytes(message));
  const txs = await reservationChannel.attach(
    msg.payload,
    msg.address,
    depth,
    mwm,
  );
  log.debug('Published reservation');
  return txs[0].address;
}
