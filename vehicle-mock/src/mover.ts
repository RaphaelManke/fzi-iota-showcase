import { Vehicle } from './vehicle';
import { Trytes } from '@iota/core/typings/types';
import { Path } from './pathFinder';
import { interpolate, toGeo } from './interpolator';
import { getDistance } from 'geolib';

export class Mover {
  public static UPDATE_INTERVAL = 500; // milliseconds
  public static REACHED_THRESHOLD = 10; // meters

  private interval?: NodeJS.Timer;
  private nextStop?: Trytes;
  private continue = true;
  private worker?: () => void;

  constructor(private vehicle: Vehicle) {}

  public startDriving(
    path: Path,
    onStop?: (stop: Trytes) => void,
  ): Promise<Trytes> {
    return new Promise((resolve, reject) => {
      if (this.vehicle.stop !== path.connections[0].from) {
        reject(new Error('Vehicle is not at the start of the given path'));
      }

      let { i, next, current } = this.nextSegment(0, path);
      let driven = 0;
      let conIndex = 0;
      let con = path.connections[conIndex];
      this.nextStop = con.to;
      this.continue = true;
      this.worker = () => {
        driven += (this.vehicle.info.speed * Mover.UPDATE_INTERVAL) / 1000;
        const pos = interpolate(current, next, driven);
        this.vehicle.position = pos;
        // very close to a path point
        if (getDistance(toGeo(pos), toGeo(next)) < Mover.REACHED_THRESHOLD) {
          let stop = false;
          // reached stop ?
          if (
            getDistance(toGeo(pos), toGeo(con.path[con.path.length - 1])) <
            Mover.REACHED_THRESHOLD
          ) {
            if (onStop) {
              onStop(con.to);
            }

            // don't set next connection if trip was stopped. else wrong stop is returned
            if (this.continue) {
              conIndex++;
              if (conIndex < path.connections.length) {
                con = path.connections[conIndex];
                this.nextStop = con.to;
              }
            } else {
              stop = true;
            }
          }

          // path points left ?
          if (i < path.waypoints.length - 1 && !stop) {
            ({ current, next, i } = this.nextSegment(i, path));
            driven = 0;
          } else {
            // arrived
            clearInterval(this.interval!);
            this.interval = undefined;
            this.worker = undefined;
            resolve(con.to);
          }
        }
      };
      this.interval = setInterval(this.worker, Mover.UPDATE_INTERVAL);
    });
  }

  public isDriving() {
    return this.interval !== undefined;
  }

  public stopImmediatly() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  public resumeDriving() {
    if (!this.interval && this.worker) {
      this.interval = setInterval(this.worker, Mover.UPDATE_INTERVAL);
    }
  }

  public stopDrivingAtNextStop() {
    if (this.interval) {
      this.continue = false;
      return this.nextStop;
    }
  }

  private nextSegment(i: number, path: Path) {
    i++;
    return {
      i,
      current: path.waypoints[i - 1],
      next: path.waypoints[i],
    };
  }
}
