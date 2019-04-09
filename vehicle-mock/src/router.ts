import { Position } from './position';
import { Trytes } from '@iota/core/typings/types';

export class Router {
  private conntectedTo = new Map<Trytes, Set<Connection>>();

  constructor(
    connections: Connection[],
    private readonly cached: RouteResult[] = [],
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

  public getRoutes(start: Trytes, dest: Trytes, type: Type): Route[] {
    const cached = this.getCached(start, dest, type);
    if (cached.length > 0) {
      return cached;
    }
    const innerGetPath = (
      s: Trytes,
      d: Trytes,
      index: number,
      visited: Set<Trytes>,
    ): Route[] => {
      const cons = this.conntectedTo.get(s);
      visited.add(s);
      // no connections from s
      if (!cons) {
        return [];
      }
      const arr = Array.from(cons).filter((c) => c.type === type);
      const [con] = arr.filter((c) => c.to === d);
      // direct connection from s to d
      if (con) {
        return [
          {
            path: con.path,
            stops: [
              { id: s, index },
              { id: d, index: index + con.path.length - 1 },
            ],
          },
        ];
      }

      const innerRoutes: Route[] = arr
        .filter((c) => !visited.has(c.to))
        .map((c) => {
          // paths from stop connected to s to dest
          const paths = innerGetPath(
            c.to,
            dest,
            index + c.path.length - 1,
            new Set<Trytes>(visited),
          );
          return paths.map((path) => {
            const front = equals(c.path[c.path.length - 1], path.path[0])
              ? c.path.slice(0, c.path.length - 1)
              : c.path;
            return {
              stops: [{ id: s, index }, ...path.stops],
              path: [...front, ...path.path],
            };
          });
        })
        .reduce((acc, v) => {
          v.forEach((p) => acc.push(p));
          return acc;
        }, new Array<Route>())
        .sort((a, b) => a.path.length - b.path.length);

      return innerRoutes;
    };

    const routes = innerGetPath(start, dest, 0, new Set<Trytes>()).sort(
      (a, b) => a.path.length - b.path.length,
    );
    this.cached.push({ start, dest, type, routes });
    return routes;
  }

  public getCached(start: Trytes, dest: Trytes, type: Type) {
    const result = this.cached.find(
      (r) => r.start === start && r.dest === dest && r.type === type,
    );
    return result ? result.routes : [];
  }

  private add = (id: Trytes, to: Connection[]) => {
    if (!this.conntectedTo.has(id)) {
      this.conntectedTo.set(id, new Set<Connection>());
    }
    to.forEach((c) => this.conntectedTo.get(id)!.add(c));
  }
}

function equals(a: Position, b: Position) {
  return a.lat === b.lat && a.lng === b.lng;
}

export type Type = 'car' | 'bike' | 'tram';

export interface RouteResult {
  start: Trytes;
  dest: Trytes;
  routes: Route[];
  type: Type;
}

export interface Route {
  path: Position[];
  stops: Array<{ id: Trytes; index: number }>;
}
export interface Connection {
  from: Trytes;
  to: Trytes;
  path: Position[];
  type: Type;
}
