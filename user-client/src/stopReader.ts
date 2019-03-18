import { Hash } from '@iota/core/typings/types';
import { readCheckIns, readVehicleInfo, readTripFromVehicle, Trip,
  readReservations, VehicleInfo, CheckInMessage, log } from 'fzi-iota-showcase-client';
import { API } from '@iota/core';

export async function queryStop(provider: string, iota: API, stopId: Hash, callback?: (offer: Offer) => any):
    Promise<Offer[]> {
  const checkIns = await readCheckIns(iota, stopId);
  log.info('Read %s checkIns from stop address', checkIns.length);
  checkIns.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()).reverse(); // latest message first

  log.debug('Getting CheckIn Information...');
  const verifyCheckIn = verifyFunc(provider, iota, stopId, callback);
  return (await Promise.all(checkIns.map(verifyCheckIn)))
    // filter out checkIns where error occured
    .filter((offer) => offer !== undefined).map((offer) => offer!);
}

function verifyFunc(provider: string, iota: API, stopId: Hash, callback?: (offer: Offer) => any) {
  return async (tx: {txHash: string; message: CheckInMessage; timestamp: Date; }, index: number):
      Promise<Offer | undefined> => {
    log.debug('Get information of CheckIn %s...', index);
    const checkIn = tx.message;
    let vehicleId: Int8Array | undefined = checkIn.vehicleId;
    let vehicleInfo: VehicleInfo | undefined = checkIn.vehicleInfo;

    try {
      // read welcome from vehicle channel
      const {welcomeMessage, departed} = await readTripFromVehicle(checkIn.vehicleId, checkIn.tripChannelIndex, iota);
      // verify checkIn identity
      if (tx.txHash !== welcomeMessage.checkInMessageRef) {
        // checkIn was not issued by given vehicle!
        vehicleId = undefined;
      }

      let trip: Trip;
      if (!departed && checkIn.reservationRoot) { // reservationsRoot should normally be set
        const [reservations] = await Promise.all([
          // not departed, read reservations
          await readReservations(provider, checkIn.reservationRoot),
          // no vehicleInfo? read from meta info
          await (async () => {
            // don't read vehicle info from meta channel, if identity wasn't verified
            if (vehicleInfo === undefined && vehicleId !== undefined) {
              vehicleInfo = await readVehicleInfo(provider, vehicleId, iota);
            }
          })(),
        ]);

        trip = new Trip(stopId, checkIn.paymentAddress, checkIn.price, checkIn.reservationRate, reservations, false);

        // check reservations
        if (
            // not reserved
            reservations.length === 0 ||
            // likely reserved
            !(vehicleInfo && vehicleInfo.maxReservations) ||
            // not reserved
            reservations.length < vehicleInfo.maxReservations) {
          if (callback) {
            callback({trip, vehicleInfo, vehicleId});
          }
        }
      } else {
        // vehicle already departed
        trip = new Trip(stopId, checkIn.paymentAddress, checkIn.price, checkIn.reservationRate, undefined, true);
      }
      return {trip, vehicleInfo, vehicleId};
    } catch (e) {
      log.warn('Reading checkIn %s failed. Skipping. %s', tx.txHash, e);
      return undefined;
    }
  };
}

export interface Offer {
  trip: Trip;
  vehicleId?: Int8Array;
  vehicleInfo?: VehicleInfo;
}
