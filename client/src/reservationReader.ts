import { MamReader, MAM_MODE } from 'mam.ts';
import { ReservationMessage } from './messages/reservationMessage';

export async function readReservations(provider: string, channelRoot: string) {
  return await readReservationsFromChannel(new MamReader(provider, channelRoot, MAM_MODE.PUBLIC));
}

async function readReservationsFromChannel(reservationChannel: MamReader) {
  const msgs  = await reservationChannel.fetch();
  return msgs.map((m) => ReservationMessage.fromTrytes(m));
}
