import { Vehicle } from './vehicle';
import { Trytes } from '@iota/core/typings/types';
import { Path } from './pathFinder';
import { interpolate, toGeo } from './interpolator';
import { getDistance } from 'geolib';

export class Mover {
  public static UPDATE_INTERVAL = 500; // milliseconds
  public static REACHED_THRESHOLD = 10; // meters

  private interval?: NodeJS.Timer;
  private continue = true;

  constructor(private vehicle: Vehicle) {}

  public startDriving(
    paths: Path,
    onStop?: (stop: Trytes) => void,
  ): Promise<Trytes> {
    return new Promise((resolve, reject) => {
      if (this.vehicle.stop !== paths.stops[0].id) {
        reject(new Error('Vehicle is not at the start of the given path'));
      }

      let { i, next, current } = this.nextSegment(0, paths);
      let driven = 0;
      let nextStop = 1;
      this.continue = true;
      const worker = () => {
        driven += (this.vehicle.info.speed * Mover.UPDATE_INTERVAL) / 1000;
        const pos = interpolate(current, next, driven);
        this.vehicle.position = pos;
        // very close to a path point
        if (getDistance(toGeo(pos), toGeo(next)) < Mover.REACHED_THRESHOLD) {
          let stop = false;
          // reached stop ?
          if (paths.stops[nextStop].index === i) {
            if (onStop) {
              onStop(paths.stops[nextStop].id);
            }

            nextStop++;
            if (!this.continue) {
              stop = true;
            }
          }

          // path points left ?
          if (i < paths.waypoints.length - 1 && !stop) {
            ({ current, next, i } = this.nextSegment(i, paths));
            driven = 0;
          } else {
            // arrived
            clearInterval(this.interval!);
            resolve(paths.stops[nextStop - 1].id);
          }
        }
      };
      this.interval = setInterval(worker, Mover.UPDATE_INTERVAL);
    });
  }

  public stopDrivingAtNextStop() {
    if (this.interval) {
      this.continue = false;
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
