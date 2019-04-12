import { Position } from './position';
import { Trytes } from '@iota/core/typings/types';

export class PathFinder {
  private conntectedTo = new Map<Trytes, Set<Connection>>();

  constructor(
    connections: Connection[],
    private readonly cached: PathResult[] = [],
  ) {
    const stops = new Set([
      ...connections.map((c) => c.from),
      ...connections.map((c) => c.to),
    ]);
    stops.forEach((stop) => {
      const to = connections.filter((c) => c.from === stop);
      this.add(stop, to);
      // reverse direction
      const reversed: Connection[] = to.map((c) => ({
        from: c.to,
        to: c.from,
        path: Array.from(c.path).reverse(),
        type: c.type,
      }));
      reversed.forEach((c) => this.add(c.from, [c]));
    });
  }

  public getPaths(start: Trytes, dest: Trytes, types: string[]): Path[] {
    const typesSet = new Set<Trytes>(types);
    const cached = this.getCached(start, dest, types);
    if (cached.length > 0) {
      return cached;
    }
    const innerGetPaths = (
      s: Trytes,
      d: Trytes,
      index: number,
      visited: Set<Trytes>,
    ): Path[] => {
      const cons = this.conntectedTo.get(s);
      visited.add(s);
      // no connections from s
      if (!cons) {
        return [];
      }
      const arr = Array.from(cons).filter((c) => typesSet.has(c.type));
      const directCon = arr.filter((c) => c.to === d);
      // direct connections from s to d
      const direct = directCon.map((c) => ({
        waypoints: c.path,
        connections: [c],
      }));

      const innerPaths: Path[] = arr
        .filter((c) => c.to !== d) // exclude direct connections
        .filter((c) => !visited.has(c.to))
        .map((c) => {
          // paths from stop connected to s to dest
          const backPaths = innerGetPaths(
            c.to,
            dest,
            index + c.path.length - 1,
            new Set<Trytes>(visited),
          );
          return backPaths.map((path) => {
            const front = posEquals(
              c.path[c.path.length - 1],
              path.waypoints[0],
            )
              ? c.path.slice(0, c.path.length - 1)
              : c.path;
            return {
              connections: [c, ...path.connections],
              waypoints: [...front, ...path.waypoints],
            };
          });
        })
        .reduce((acc, v) => {
          v.forEach((p) => acc.push(p));
          return acc;
        }, new Array<Path>())
        .sort((a, b) => a.waypoints.length - b.waypoints.length);

      return [...direct, ...innerPaths];
    };

    const paths = innerGetPaths(start, dest, 0, new Set<Trytes>()).sort(
      (a, b) => a.waypoints.length - b.waypoints.length,
    );
    this.cached.push({ start, dest, types, paths });
    return paths;
  }

  public getCached(start: Trytes, dest: Trytes, types: string[]) {
    const result = this.cached.find(
      (r) => r.start === start && r.dest === dest && arrayEquals(r.types, types),
    );
    return result ? result.paths : [];
  }

  private add = (id: Trytes, to: Connection[]) => {
    if (!this.conntectedTo.has(id)) {
      this.conntectedTo.set(id, new Set<Connection>());
    }
    to.forEach((c) => this.conntectedTo.get(id)!.add(c));
  }
}

function arrayEquals(a: any[], b: any[]) {
  if (!a) {
    return !b;
  }

  // compare lengths - can save a lot of time
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0, l = a.length; i < l; i++) {
    // Check if we have nested arrays
    if (a[i] instanceof Array && b[i] instanceof Array) {
      // recurse into the nested arrays
      if (!arrayEquals(a[i], b[i])) {
        return false;
      }
    } else if (a[i] !== b[i]) {
      // Warning - two different object instances will never be equal: {x:20} != {x:20}
      return false;
    }
  }
  return true;
}

function posEquals(a: Position, b: Position) {
  return a.lat === b.lat && a.lng === b.lng;
}

export interface PathResult {
  start: Trytes;
  dest: Trytes;
  paths: Path[];
  types: string[];
}

export interface Path {
  waypoints: Position[];
  connections: Connection[];
}
export interface Connection {
  from: Trytes;
  to: Trytes;
  path: Position[];
  type: string;
}
