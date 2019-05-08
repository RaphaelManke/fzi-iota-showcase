import { UserState, Sender, TripHandler } from 'fzi-iota-showcase-user-client';
import { CheckInMessage } from 'fzi-iota-showcase-client';

export class UserMock extends UserState {
  public isOnTrip = false;

  public createTripHandler(
    destination: string,
    checkInMessage: CheckInMessage,
    maxPrice: number,
    duration: number,
    sender: Sender,
  ): TripHandler {
    this.isOnTrip = true;
    return super.createTripHandler(
      destination,
      checkInMessage,
      maxPrice,
      duration,
      sender,
    );
  }
}
