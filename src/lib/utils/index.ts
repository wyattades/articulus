import * as _ from 'lodash-es';

export const isNum = (x: unknown): x is number =>
  typeof x === 'number' && !Number.isNaN(x);

export const validPoint = (p: unknown): p is Point => {
  try {
    return (
      p != null &&
      typeof p === 'object' &&
      isNum((p as Record<string, unknown>).x) &&
      isNum((p as Record<string, unknown>).y)
    );
  } catch {
    return false;
  }
};

export const constrain = (v: number, min: number | null, max: number | null) =>
  min != null && v < min ? min : max != null && v > max ? max : v;

export const mapNumber = (
  val: number,
  fromA: number,
  fromB: number,
  toA: number,
  toB: number,
) => (val - fromA) * ((toB - toA) / (fromB - fromA)) + toA;

export const factoryMapNumber = (
  fromA: number,
  fromB: number,
  toA: number,
  toB: number,
) => {
  const ratio = (toB - toA) / (fromB - fromA);
  return (val: number) => (val - fromA) * ratio + toA;
};

let _id = 1;
export const nextId = () => _id++;
export const setNextId = (val: number) => {
  if (val > _id) _id = val;
};

export const firstIterableValue = <T>(set: Iterable<T>): T | undefined => {
  for (const el of set) return el;
  return undefined;
};

export function* circle4Points(
  radius: number,
  startRotation = 0,
): Generator<[number, number], void, unknown> {
  const cos = Math.cos(startRotation) * radius;
  const sin = Math.sin(startRotation) * radius;

  yield [cos, sin];
  yield [sin, -cos];
  yield [-cos, -sin];
  yield [-sin, cos];
}

export const midpoint = (a: Point, b: Point): Point => {
  return {
    x: (a.x + b.x) * 0.5,
    y: (a.y + b.y) * 0.5,
  };
};

export const anySame = (
  objA: Record<string, unknown>,
  objB: Record<string, unknown>,
) => {
  for (const key in objA) if (key in objB) return true;
  return false;
};

export function* valuesIterator<T>(obj: Record<string, T> | T[]) {
  if (Array.isArray(obj)) {
    for (const v of obj) yield v;
  } else {
    for (const k in obj) yield obj[k];
  }
}

export const getFirstValue = <T>(obj: Record<string, T>): T | null => {
  for (const id in obj) return obj[id];
  return null;
};

export const getFirstSameKeyValue = <T>(
  a: Record<string, T>,
  b: Record<string, T>,
): T | null => {
  for (const k in a) if (k in b) return a[k];

  for (const k in b) if (k in a) return a[k];

  return null;
};

export const factoryRotateAround = (
  center: Point,
  angle: number,
): ((point: Point) => Point) => {
  const cos = Math.cos(angle),
    sin = Math.sin(angle);

  // this method mutates `point`
  return (point) => {
    const px = point.x - center.x,
      py = point.y - center.y;

    point.x = cos * px - sin * py + center.x;
    point.y = sin * px + cos * py + center.y;

    return point;
  };
};

const defaultEllipsePointCount = (w: number, h: number): number => {
  const m = Math.max(w, h);
  if (m <= 100) return 16;
  if (m <= 1000) return 32;
  return 64;
};

export const getEllipsePoints = (
  ox: number,
  oy: number,
  w: number,
  h: number,
  rotation = 0,
  numPoints = defaultEllipsePointCount(w, h),
) => {
  const a = w / 2,
    b = h / 2;

  const points = [];

  const rotateAround = rotation
    ? factoryRotateAround({ x: ox, y: oy }, rotation)
    : null;

  const delta = (2 * Math.PI) / numPoints;
  for (let angle = 0; angle < Math.PI * 2; angle += delta) {
    const p = {
      x: ox + a * Math.cos(angle),
      y: oy + b * Math.sin(angle),
    };

    points.push(rotateAround ? rotateAround(p) : p);
  }

  return points;
};

const charSample = _.shuffle(
  Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'),
);
export const base48 = (size = 8) =>
  Array.from({ length: size })
    .map(() => _.sample(charSample))
    .join('');
