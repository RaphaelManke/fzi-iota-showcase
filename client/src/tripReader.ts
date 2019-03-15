import { RAAMReader } from 'raam.client.js';
import { API, composeAPI } from '@iota/core';
import { StopWelcomeMessage } from './messages/stopWelcomeMessage';

export async function readTripFromVehicle(vehicleId: Int8Array, tripIndex: number, iota: API) {
  return await readTripFromMasterChannel(new RAAMReader(vehicleId, {iota}), tripIndex);
}

export async function readTripFromMasterChannel(masterChannel: RAAMReader, tripIndex: number) {
  if (masterChannel.iota) {
    const welcomeMessage = await readWelcomeMessage(masterChannel, tripIndex);
    const departed = await readDeparted(welcomeMessage, masterChannel.iota);
    return {
      welcomeMessage,
      departed,
    };
  } else {
    throw new Error('Master channel must be initialized with an instance of IOTA API.');
  }
}

export async function readWelcomeMessageFromVehicle(vehicleId: Int8Array, tripIndex: number, iota: API) {
  return await readWelcomeMessage(new RAAMReader(vehicleId, {iota}), tripIndex);
}

export async function readWelcomeMessage(masterChannel: RAAMReader, tripIndex: number) {
  if (masterChannel.iota) {
    const result = await masterChannel.fetch({index: tripIndex});
    const welcomeMessage: StopWelcomeMessage = {
      checkInMessageRef: result.messages[0],
      tripChannelId: result.branches[0],
    };
    return welcomeMessage;
  } else {
    throw new Error('Master channel must be initialized with an instance of IOTA API.');
  }
}

export async function readDeparted(
    welcomeMessage: StopWelcomeMessage, iota: API, readReservations = false) {
  const tripChannel = new RAAMReader(welcomeMessage.tripChannelId, {iota});
  const {messages: [checkOut]} = await tripChannel.fetch({index: 0});
  return checkOut !== undefined;
}
