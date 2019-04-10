import { PathFinder, Path } from 'fzi-iota-showcase-vehicle-mock';
import { Connection } from './envInfo';
import { VehicleInfo } from './vehicleInfo';
import { Trytes } from '@iota/core/typings/types';
import { RouteInfo, Section } from './routeInfo';
import { getPathLength } from 'geolib';
import { access } from 'fs';

export class Router {
  private pathFinder: PathFinder;

  constructor(connections: Connection[], private vehicles: VehicleInfo[]) {
    this.pathFinder = new PathFinder(connections);
  }

  public getRoutes(
    start: Trytes,
    destination: Trytes,
    types: string[],
    departureTime = new Date(),
  ): RouteInfo[] {
    const paths = this.pathFinder.getPaths(start, destination, types);
    const routes: RouteInfo[][] = paths.map((p) => {
      const reducedConnections = this.reduceConnections(p);

      return this.buildSections(reducedConnections, departureTime).map(
        (sections) => ({
          start,
          destination,
          sections,
        }),
      );
    });

    return routes.reduce((acc, v) => {
      acc.push(...v);
      return acc;
    }, []);
  }

  private reduceConnections(p: Path) {
    const reducedConnections: ReducedConnection[] = [];
    let cur: ReducedConnection = {
      ...p.connections[0],
      intermediateStops: [],
    };
    for (let i = 1; i < p.connections.length; i++) {
      const c = p.connections[i];
      if (cur.type === c.type) {
        cur = {
          from: cur.from,
          to: c.to,
          type: c.type,
          path: [...cur.path, ...c.path],
          intermediateStops: [...cur.intermediateStops, c.from],
        };
      } else {
        reducedConnections.push(cur);
        cur = { ...c, intermediateStops: [] };
      }
    }
    reducedConnections.push(cur);
    return reducedConnections;
  }

  private buildSections(
    remainingConnections: ReducedConnection[],
    start: Date,
  ): Section[][] {
    const c = remainingConnections[0];
    const vehicles = this.vehicles
      .filter((v) => v.checkIn)
      .filter((v) => v.checkIn!.stop === c.from)
      .filter((v) => v.info.type === c.type);

    const distance = getPathLength(
      c.path.map((pos) => ({ latitude: pos.lat, longitude: pos.lng })),
    );
    const sections = vehicles.map(
      (v): Section => {
        const validFrom = v.checkIn!.message.validFrom;
        const departure = validFrom
          ? validFrom.getTime() > start.getTime()
            ? validFrom
            : start
          : start;
        const secs = (distance * 1000) / v.info.speed;
        const arrival = new Date(departure.getTime() + secs);

        return {
          vehicle: { id: v.id, type: v.info.type },
          price: v.checkIn!.message.price,
          from: c.from,
          to: c.to,
          intermediateStops: c.intermediateStops,
          distance,
          departure,
          arrival,
        };
      },
    );

    const remain = remainingConnections.slice(1);
    if (remain.length === 0) {
      return [sections];
    } else {
      const result: Section[][] = [];
      for (const head of sections) {
        for (const s of this.buildSections(remain, head.arrival)) {
          result.push([head, ...s]);
        }
      }
      return result;
    }
  }
}

interface ReducedConnection extends Connection {
  intermediateStops: Trytes[];
}
