import { Vehicle } from '../vehicle';
import { EventEmitter2 } from 'eventemitter2';
import { Trytes } from '@iota/core/typings/types';

export default class VehicleMock implements Vehicle {
  public readonly id: Trytes;
  private started = false;
  private ispeed = 1;
  private events: EventEmitter2;

  constructor(id: Trytes, events: EventEmitter2) {
    this.id = id;
    this.events = events;
  }

  public start() {
    if (!this.started) {
      this.events.emit('started', { id: this.id });
      this.started = true;
    }
  }

  public stop() {
    if (this.started) {
      this.events.emit('stopped', { id: this.id });
      this.started = false;
    }
  }

  set speed(speed: number) {
    this.ispeed = speed;
    this.events.emit('speedSet', { id: this.id, speed: this.speed });
  }

  get speed() {
    return this.ispeed;
  }

  public markerDetected = (id: string) =>
    this.events.emit('markerDetected', { id: this.id, markerId: id })
}
