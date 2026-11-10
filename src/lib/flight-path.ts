/**
 * Flight path of the paper plane in the hero title (pure functions, unit tested).
 *
 * Coordinates are in "word units": x = 0 is the left edge of the word and x = 1 the right one; y = 0 is
 * its top edge and y = 1 the bottom. The plane enters at the top left, dives to the word, crosses it from
 * left to right (erasing it on the way) and leaves climbing on the right.
 */

export interface Point {
  x: number;
  y: number;
}

export type Curve = [Point, Point, Point, Point];

/** Control points of the cubic Bézier curve of the flight. */
export const FLIGHT_PATH: Curve = [
  { x: -0.9, y: -0.6 },
  { x: -0.15, y: 1.25 },
  { x: 0.9, y: 0.9 },
  { x: 1.9, y: -0.25 },
];

export function bezier([p0, p1, p2, p3]: Curve, t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return { x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y };
}

/** Derivative of the curve: the direction the plane points to. */
export function tangent([p0, p1, p2, p3]: Curve, t: number): Point {
  const u = 1 - t;
  return {
    x: 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x),
    y: 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y),
  };
}

/** Enters fast, slows down over the word and speeds up on the way out (symmetric sine easing). */
export function easeInOut(f: number): number {
  const c = Math.min(Math.max(f, 0), 1);
  return 0.5 - Math.cos(Math.PI * c) / 2;
}

export interface FlightFrame {
  /** Centre of the plane, in word units. */
  x: number;
  y: number;
  /** Angle in degrees (0 = pointing right). */
  angle: number;
  /** Vertical scale: fakes the plane banking as it turns. */
  bank: number;
  opacity: number;
}

/** State of the plane at fraction `f` (0–1) of the flight. */
export function frameAt(f: number, path = FLIGHT_PATH): FlightFrame {
  const t = easeInOut(f);
  const p = bezier(path, t);
  const d = tangent(path, t);
  const fadeIn = Math.min(f / 0.12, 1);
  const fadeOut = Math.min((1 - f) / 0.15, 1);
  return {
    x: p.x,
    y: p.y,
    angle: (Math.atan2(d.y, d.x) * 180) / Math.PI,
    bank: 0.7 + 0.3 * Math.abs(Math.cos(Math.PI * f)),
    opacity: Math.max(0, Math.min(fadeIn, fadeOut)),
  };
}

/**
 * CSS masks of both words for the plane at `x`: the leaving word is erased right behind the plane and the
 * entering one appears behind it, with a soft edge.
 */
export function wordMasks(x: number): { leaving: string; entering: string } {
  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
  return {
    leaving: `linear-gradient(90deg, transparent ${pct(x - 0.06)}, #000 ${pct(x + 0.1)})`,
    entering: `linear-gradient(90deg, #000 ${pct(x - 0.2)}, transparent ${pct(x - 0.02)})`,
  };
}
