import { getDistance } from 'geolib';
import { Position } from './position';
import { Vector } from 'vector2d';

export function interpolate(from: Position, to: Position, driven: number): Position {
  const dist = getDistance({latitude: from.lat, longitude: from.lng}, {latitude: to.lat, longitude: to.lng}, 1, 1);
  const l = Math.max(1, driven / dist);
  const a = new Vector(from.lng, from.lat);
  const b = new Vector(to.lng, to.lat);
  // (1 - l) * from + l * B;
  const c = a.mulS(1 - l).add(b.mulS(l));
  return {lng: c.x, lat: c.y};
}
