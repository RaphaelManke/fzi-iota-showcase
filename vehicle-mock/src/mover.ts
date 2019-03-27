import { Vehicle } from './vehicle';
import { Trytes } from '@iota/core/typings/types';
import { Router, Route } from './router';
import { interpolate, toGeo } from './interpolator';
import { getDistance } from 'geolib';

export class Mover {
  public static UPDATE_INTERVAL = 500;
  public static REACHED_THRESHOLD = 10;

  private interval?: NodeJS.Timer;

  constructor(private router: Router, private vehicle: Vehicle, private dest: Trytes) {}

  public startDriving(onArrived: (stop: Trytes) => void, onStop?: (stop: Trytes) => void): Promise<Trytes> {
    if (this.vehicle.stop) {
      const [route] = this.router.getRoutes(this.vehicle.stop, this.dest, this.vehicle.info.type);
      if (route) {
        return new Promise((resolve, reject) => {
          let {i, next, current} = this.nextSegment(0, route);
          let driven = 0;
          let nextStop = 1;
          const worker = () => {
            driven += this.vehicle.info.speed * Mover.UPDATE_INTERVAL / 1000;
            const pos = interpolate(current, next, driven);
            this.vehicle.position = pos;
            if (getDistance(toGeo(pos), toGeo(next)) < Mover.REACHED_THRESHOLD) {
              // reached stop?
              if (onStop && route.stops[nextStop].index === i) {
                onStop(route.stops[nextStop].id);
                nextStop++;
              }

              if (i < route.path.length - 1) {
                ({current, next, i} = this.nextSegment(i, route));
                driven = 0;
              } else {
                // arrived
                clearInterval(this.interval!);
                onArrived(this.dest);
                resolve(this.dest);
              }
            }
          };
          this.interval = setInterval(worker, Mover.UPDATE_INTERVAL);
        });
      } else {
        throw new Error('No route to this destination');
      }
    } else {
      throw new Error('Vehicle isn\'t at a stop');
    }
  }

  public stopDrivingAtNextStop() {
    if (this.interval) {
      // TODO wait until vehicle reached next stop
      clearInterval(this.interval);
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

