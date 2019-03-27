import { Position } from './position';
import { Trytes } from '@iota/core/typings/types';

export class Router {
  private conntectedTo = new Map<Trytes, Set<Connection>>();

  constructor(private connections: Connection[]) {
    const stops = new Set([...connections.map((c) => c.from), ...connections.map((c) => c.to)]);
    stops.forEach((stop) => {
      const to = connections.filter((c) => c.from === stop);
      this.add(stop, to);
      // reverse direction
      const reversed: Connection[] = to.map((c) =>
        ({from: c.to, to: c.from, path: Array.from(c.path).reverse(), type: c.type}));
      reversed.forEach((c) => this.add(c.from, [c]));
    });
  }

  public getPath(start: Trytes, dest: Trytes, type: Type):
      Route | undefined {
    const visited = new Set<Trytes>();
    const innerGetPath = (s: Trytes, d: Trytes, index: number): Route | undefined => {
      const cons = this.conntectedTo.get(s);
      visited.add(s);
      if (!cons) {
        return undefined;
      }
      const arr = Array.from(cons).filter((c) => c.type === type);
      const [con] = arr.filter((c) => c.to === d);
      if (con) {
        return {path: con.path, stops: [{id: s, index}, {id: d, index: index + con.path.length - 1 }]};
      }
      const routes: Route[] = arr.filter((c) => !visited.has(c.to)).map((c) => {
        const path = innerGetPath(c.to, dest, index + c.path.length - 1);
        if (path) {
          const front = this.equals(c.path[c.path.length - 1], path.path[0]) ?
            c.path.slice(0, c.path.length - 1) : c.path;
          return {stops: [{id: s, index}, ...path.stops], path: [...front, ...path.path]};
        } else {
          return undefined;
        }
      }).filter((p) => p).map((p) => p!).sort((a, b) => a.path.length - b.path.length);

      return routes.length > 0 ? routes[0] : undefined;
    };
    return innerGetPath(start, dest, 0);
  }

  private equals(a: Position, b: Position) {
    return a.lat === b.lat && a.lng === b.lng;
  }

  private add = (id: Trytes, to: Connection[]) => {
    if (!this.conntectedTo.has(id)) {
      this.conntectedTo.set(id, new Set<Connection>());
    }
    to.forEach((c) => this.conntectedTo.get(id)!.add(c));
  }


}

export type Type = 'car' | 'bike' | 'tram';

export interface Route {
  path: Position[];
  stops: Array<{id: Trytes, index: number}>;
}
export interface Connection {
  from: Trytes;
  to: Trytes;
  path: Position[];
  type: Type;
}
