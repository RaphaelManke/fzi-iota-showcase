export class Reservation {
  constructor(public readonly hashedNonce: string, public readonly expireDate: Date) {
  }

  public isExpired() {
    return new Date() >= this.expireDate;
  }
}
