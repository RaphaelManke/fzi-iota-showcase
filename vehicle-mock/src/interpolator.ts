import { getDistance } from 'geolib';
import { Position } from './position';
import { Vector } from 'vector2d';

export function interpolate(from: Position, to: Position, driven: number): Position {
  const dist = getDistance(toGeo(from), toGeo(to), 1, 1);
  const l = Math.min(1, driven / dist);
  const a = new Vector(from.lng, from.lat);
  const b = new Vector(to.lng, to.lat);
  // (1 - l) * from + l * B;
  const c = a.mulS(1 - l).add(b.mulS(l));
  return {lng: c.x, lat: c.y};
}

export function toGeo(pos: Position) {
  return {latitude: pos.lat, longitude: pos.lng};
}
