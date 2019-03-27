import { Position } from './position';
import { Trytes } from '@iota/core/typings/types';

export class Router {
  private conntectedTo = new Map<Trytes, Set<Connection>>();

  constructor(private stops: Array<Position & {id: Trytes}>,
              private connections: Connection[]) {
    stops.forEach((stop) => {
      const to = connections.filter((c) => c.from === stop.id);
      this.add(stop.id, to);
      // reverse direction
      const reversed: Connection[] = to.map((c) =>
        ({from: c.to, to: c.from, path: Array.from(c.path).reverse(), type: c.type}));
      reversed.forEach((c) => this.add(c.from, [c]));
    });
  }

  public getPath(start: Trytes, dest: Trytes, type: 'car' | 'bike' | 'tram'):
      {path: Position[], stops: Trytes[]} | undefined {
    const visited = new Set<Trytes>();
    const innerGetPath = (s: Trytes, d: Trytes): {path: Position[], stops: Trytes[]} | undefined => {
      const cons = this.conntectedTo.get(s);
      visited.add(s);
      if (!cons) {
        return undefined;
      }
      const arr = Array.from(cons).filter((c) => c.type === type);
      const [con] = arr.filter((c) => c.to === d);
      if (con) {
        return {path: con.path, stops: [s, d]};
      }
      const paths: Array<{stops: Trytes[], path: Position[]}> = arr.filter((c) => !visited.has(c.to)).map((c) => {
        const path = innerGetPath(c.to, dest);
        if (path) {
          const front = this.equals(c.path[c.path.length - 1], path.path[0]) ?
            c.path.slice(0, c.path.length - 1) : c.path;
          return {stops: [s, ...path.stops], path: [...front, ...path.path]};
        } else {
          return undefined;
        }
      }).filter((p) => p).map((p) => p!).sort((a, b) => a.path.length - b.path.length);
      return paths.length > 0 ? paths[0] : undefined;
    };
    return innerGetPath(start, dest);
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

export interface Connection {
  from: Trytes;
  to: Trytes;
  path: Position[];
  type: 'car' | 'bike' | 'tram';
}
