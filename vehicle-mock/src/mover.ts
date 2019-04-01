import { Vehicle } from './vehicle';
import { Trytes } from '@iota/core/typings/types';
import { Route } from './router';
import { interpolate, toGeo } from './interpolator';
import { getDistance } from 'geolib';

export class Mover {
  public static UPDATE_INTERVAL = 2000; // milliseconds
  public static REACHED_THRESHOLD = 10; // meters

  private interval?: NodeJS.Timer;
  private continue = true;

  constructor(private vehicle: Vehicle) {}

  public startDriving(
    route: Route,
    onStop?: (stop: Trytes) => void,
  ): Promise<Trytes> {
    return new Promise((resolve, reject) => {
      if (this.vehicle.stop !== route.stops[0].id) {
        reject(new Error('Vehicle is not at the start of the given route'));
      }

      let { i, next, current } = this.nextSegment(0, route);
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
          if (route.stops[nextStop].index === i) {
            if (onStop) {
              onStop(route.stops[nextStop].id);
            }

            nextStop++;
            if (!this.continue) {
              stop = true;
            }
          }

          // path points left ?
          if (i < route.path.length - 1 && !stop) {
            ({ current, next, i } = this.nextSegment(i, route));
            driven = 0;
          } else {
            // arrived
            clearInterval(this.interval!);
            resolve(route.stops[nextStop - 1].id);
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

  private nextSegment(i: number, route: Route) {
    i++;
    return {
      i,
      current: route.path[i - 1],
      next: route.path[i],
    };
  }
}
