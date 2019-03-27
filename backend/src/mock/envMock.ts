import VehicleMock from './vehicleMock';
import { EventEmitter2 } from 'eventemitter2';
import { Environment } from '../env';
import { EnvironmentInfo } from '../envInfo';
import { SafeEmitter } from '../events';

export default class EnvironmentMock implements Environment {
  public static EPS = 0.9;
  public static MARKER_RESEND_TIMEOUT = 1500;
  public static SIZE = 10;

  private markers = new Array<Marker>();
  private vehicles = new Map<VehicleMock, Mover>();

  constructor(public info: EnvironmentInfo, private events: SafeEmitter) {
    events.onIntern('started', (data) => {
      const v = Array.from(this.vehicles.keys()).find(
        (e) => e.id === data.id,
      );
      if (v) {
        const m = this.vehicles.get(v);
        if (m) {
          m.interval = setInterval(m.worker, 1000);
        }
      }
    });
    events.onIntern('stopped', (data) => {
      const v = Array.from(this.vehicles.keys()).find(
        (e) => e.id === data.id,
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
      this.updatePos(v, v.speed, 0);
    };
    this.vehicles.set(v, { pos: { x, y }, worker, interval: undefined });
    this.events.emitIntern('vehicleAdded', { id: v.id, x, y });
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
    this.events.emitIntern('markerAdded', { id, x, y });
  }

  public getVehicle(id: string) {
    return Array.from(this.vehicles.keys()).find((v) => v.id === id);
  }

  private updatePos(v: VehicleMock, x: number, y: number) {
    const m = this.vehicles.get(v);
    if (m === undefined) {
      throw new Error(v.id + ' is not part of environment');
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
    this.events.emitIntern('updatedPos', {
      id: v.id,
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
