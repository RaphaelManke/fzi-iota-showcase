export abstract class ReservationMessage {
  constructor(public readonly hashedNonce: string, public readonly expireDate: Date) {
  }

  public isExpired(): boolean {
    return new Date() >= this.expireDate;
  }
}
