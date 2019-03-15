import VehicleMock from './vehicleMock';
import { EventEmitter2 } from 'eventemitter2';
import { Environment, EnvironmentInfo } from '../env';

export default class EnvironmentMock implements Environment {
  public static EPS = 0.9;
  public static MARKER_RESEND_TIMEOUT = 1500;
  public static SIZE = 10;

  public info: EnvironmentInfo;
  private markers = new Array<Marker>();
  private vehicles = new Map<VehicleMock, Mover>();

  private events: EventEmitter2;

  constructor(info: EnvironmentInfo, events: EventEmitter2) {
    this.events = events;
    this.info = info;
    events.on('started', (data) => {
      const v = Array.from(this.vehicles.keys()).find(
        (e) => e.getId() === data.id,
      );
      if (v) {
        const m = this.vehicles.get(v);
        if (m) {
          m.interval = setInterval(m.worker, 1000);
        }
      }
    });
    events.on('stopped', (data) => {
      const v = Array.from(this.vehicles.keys()).find(
        (e) => e.getId() === data.id,
      );
      if (v) {
        const m = this.vehicles.get(v);
        if (m !== undefined && m.interval !== undefined) {
          clearInterval(m.interval);
        }
      }
    });
  }

  public addVehicle(v: VehicleMock, x: number, y: number) {
    const worker = () => {
      this.updatePos(v, v.getSpeed(), 0);
    };
    this.vehicles.set(v, { pos: { x, y }, worker, interval: undefined });
    this.events.emit('vehicleAdded', { id: v.getId(), x, y });
    this.checkForMarkers(v, x, y);
    // send marker detected even if position doesn't change
    setInterval(() => {
      const m = this.vehicles.get(v);
      if (m) {
        this.checkForMarkers(v, m.pos.x, m.pos.y);
      }
    }, EnvironmentMock.MARKER_RESEND_TIMEOUT);
  }

  public addMarker(id: string, x: number, y: number) {
    this.markers.push({ id, x, y });
    this.events.emit('markerAdded', { id, x, y });
  }

  public getVehicle(id: string) {
    return Array.from(this.vehicles.keys()).find((v) => v.getId() === id);
  }

  private updatePos(v: VehicleMock, x: number, y: number) {
    const m = this.vehicles.get(v);
    if (m === undefined) {
      throw new Error(v.getId() + ' is not part of environment');
    }
    const position = {
      x: (m.pos.x + x) % EnvironmentMock.SIZE,
      y: (m.pos.y + y) % EnvironmentMock.SIZE,
    };
    this.vehicles.set(v, {
      worker: m.worker,
      pos: position,
      interval: m.interval,
    });
    this.events.emit('updatedPos', {
      id: v.getId(),
      x: position.x,
      y: position.y,
    });
    this.checkForMarkers(v, position.x, position.y);
    return position;
  }

  private checkForMarkers(v: VehicleMock, x: number, y: number) {
    const f: Marker | undefined = this.markers.find(
      (o: Marker) =>
        Math.sqrt(
          Math.pow(Math.abs(x - o.x), 2) + Math.pow(Math.abs(y - o.y), 2),
        ) < EnvironmentMock.EPS,
    );
    if (f) {
      v.markerDetected(f.id);
    }
  }
}

type Marker = Position & {
  id: string;
};

interface Position {
  x: number;
  y: number;
}

interface Mover {
  worker: () => void;
  pos: Position;
  interval: any | undefined;
}
