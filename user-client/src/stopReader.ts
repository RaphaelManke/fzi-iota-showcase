import { Hash } from '@iota/core/typings/types';
import { readCheckIns, readVehicleInfo, readTripFromVehicle, Trip,
  readReservations, VehicleInfo, CheckInMessage, log } from 'fzi-iota-showcase-client';
import { API } from '@iota/core';

export async function queryStop(provider: string, iota: API, stopId: Hash, callback?: (offer: Offer) => any):
    Promise<Offer[]> {
  const checkIns = await readCheckIns(iota, stopId);
  log.info('Read %s checkIns from stop address', checkIns.length);
  checkIns.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()).reverse(); // latest message first

  log.debug('Verifying each checkIn...');
  const verifyCheckIn = verifyFunc(provider, iota, stopId, callback);
  return await Promise.all(checkIns.map(verifyCheckIn));
}

function verifyFunc(provider: string, iota: API, stopId: Hash, callback?: (offer: Offer) => any) {
  return async (tx: {txHash: string; message: CheckInMessage; timestamp: Date; }) => {
    const checkIn = tx.message;

    let trip: Trip;
    let vehicleId: Int8Array | undefined = checkIn.vehicleId;
    let vehicleInfo: VehicleInfo | undefined = checkIn.vehicleInfo;

    // read welcome from vehicle channel
    const {welcomeMessage, departed} = await readTripFromVehicle(checkIn.vehicleId, checkIn.tripChannelIndex, iota);
    // verify checkIn identity
    if (tx.txHash === welcomeMessage.checkInMessageRef) {
      // checkIn was not issued by given vehicle!
      vehicleId = undefined;
    }

    if (!departed && checkIn.reservationRoot) { // reservationsRoot should normally be set
      const [reservations] = await Promise.all([
        // not departed, read reservations
        await readReservations(provider, checkIn.reservationRoot),
        // no vehicleInfo? read from meta info
        await (async () => {
          if (!vehicleInfo && vehicleId) { // don't read vehicle info from meta channel, if identity wasn't verified
            vehicleInfo = await readVehicleInfo(provider, vehicleId, iota);
          }
        }),
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
  };
}

export interface Offer {
  trip: Trip;
  vehicleId?: Int8Array;
  vehicleInfo?: VehicleInfo;
}
