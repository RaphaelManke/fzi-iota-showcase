import { Vehicle } from '../vehicle';
import { Trytes } from '@iota/core/typings/types';
import { SafeEmitter } from '../events';

export default class VehicleMock implements Vehicle {
  private started = false;
  private ispeed = 1;

  constructor(public readonly id: Trytes, private readonly events: SafeEmitter) {}

  public start() {
    if (!this.started) {
      this.events.emitIntern('started', { id: this.id });
      this.started = true;
    }
  }

  public stop() {
    if (this.started) {
      this.events.emitIntern('stopped', { id: this.id });
      this.started = false;
    }
  }

  set speed(speed: number) {
    this.ispeed = speed;
    this.events.emitIntern('speedSet', { id: this.id, speed: this.speed });
  }

  get speed() {
    return this.ispeed;
  }

  public markerDetected = (id: string) =>
    this.events.emitIntern('markerDetected', { id: this.id, markerId: id })
}
