import { Vehicle } from '../vehicle';
import Mock from './mock';
import { EventEmitter2 } from 'eventemitter2';
import { Trytes } from '@iota/core/typings/types';

export default class VehicleMock implements Vehicle, Mock {
  private id: Trytes;
  private started = false;
  private speed = 1;
  private events: EventEmitter2;

  constructor(id: Trytes, events: EventEmitter2) {
    this.id = id;
    this.events = events;
  }

  public getId = () => this.id;

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

  public setSpeed(speed: number) {
    this.speed = speed;
    this.events.emit('speedSet', { id: this.id, speed: this.speed });
  }

  public getSpeed = () => this.speed;

  public markerDetected = (id: string) =>
    this.events.emit('markerDetected', { id: this.id, markerId: id })

  public rfidDetected = (id: string) =>
    this.events.emit('rfidDetected', { id: this.id, rfid: id })

  public rfidRemoved = () => this.events.emit('rfidRemoved', { id: this.id });
}
