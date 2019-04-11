

export class BoardingHandler {
  private iState = State.OPENED;

  public get state() {
    return this.iState;
  }
}

export enum State {
  OPENED,
  VEHICLE_AUTHENTICATED,
  ROUTE_PRICED,
  
}
