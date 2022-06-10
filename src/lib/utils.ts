import Phaser from 'phaser';
import * as _ from 'lodash-es';
import Flatten from '@flatten-js/core';

import { MoreIntersects } from 'lib/intersects';
import { Geom, GEOM_NAMES } from 'lib/geom';
import type { Part } from 'src/objects';
import type { BaseScene } from 'src/scenes/Scene';

export const TEMP_RECT = new Phaser.Geom.Rectangle();

export const colorIntToHex = (num: number) =>
  `#${`00000${num.toString(16)}`.slice(-6)}`;

export const colorInverse = (num: number): number => {
  const { red, green, blue } = Phaser.Display.Color.IntegerToColor(num);
  return red * 0.299 + green * 0.587 + blue * 0.114 > 186 ? 0x000000 : 0xffffff;
};

export const isNum = (x: number): boolean =>
  typeof x === 'number' && !Number.isNaN(x);

export const validPoint = (p: any): p is Point => {
  try {
    return p != null && isNum(p.x) && isNum(p.y);
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

const shifts = [0, 8, 16];
export const adjustBrightness = (color: number, n: number) =>
  shifts.reduce(
    (r, i) => r + (constrain(((color & (255 << i)) >> i) + n, 0, 255) << i),
    0,
  );

let _id = 1;
export const nextId = () => _id++;
export const setNextId = (val: number) => {
  if (val > _id) _id = val;
};

const charSample = Array.from(
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
);

export const base48 = (size = 8) =>
  Array.from({ length: size })
    .map(() => charSample[Math.floor(Math.random() * charSample.length)])
    .join('');

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

const fromEntries = <Pair extends readonly [any, any]>(
  pairs: Pair[],
): { [key in Pair[0]]: Pair[1] } => Object.fromEntries(pairs);

const INTERSECT_MATRIX = (() => {
  const POINT_THICKNESS = 6;

  const { PointToLine } = Phaser.Geom.Intersects;

  const containsPointNames = [
    'Circle',
    'Ellipse',
    'Polygon',
    'Rectangle',
  ] as const;

  const ContainsPoint = (
    point: Point,
    geom: InstanceType<typeof Phaser.Geom[typeof containsPointNames[number]]>,
  ) => geom.contains(point.x, point.y);

  type GeomName = typeof GEOM_NAMES[keyof typeof GEOM_NAMES];

  // All available Geom intersect algorithms
  const Intersects: {
    [key in `${GeomName}To${GeomName}`]?: (a: any, b: any) => boolean;
  } = {
    ...Phaser.Geom.Intersects,
    ...MoreIntersects,
    PointToLine: (point: Point, line: Phaser.Geom.Line) =>
      PointToLine(point, line, POINT_THICKNESS),

    ...fromEntries(
      containsPointNames.map(
        (name) => [`PointTo${name}`, ContainsPoint] as const,
      ),
    ),
  };

  const TYPES = Object.entries(GEOM_NAMES).reduce((arr, [type, name]) => {
    arr[Number(type)] = name;
    return arr;
  }, [] as (typeof GEOM_NAMES[number] | undefined)[]);

  return TYPES.map((a) =>
    TYPES.map((b) => (a && b ? Intersects[`${a}To${b}`] : undefined)),
  );
})();

export const intersectsGeoms = (g1: Geom, g2: Geom) => {
  let fn;

  if ((fn = INTERSECT_MATRIX[g1.type][g2.type])) return fn(g1, g2);

  if ((fn = INTERSECT_MATRIX[g2.type][g1.type])) return fn(g2, g1);

  console.warn(
    'Missing intersect fn for:',
    GEOM_NAMES[g1.type],
    GEOM_NAMES[g2.type],
    INTERSECT_MATRIX,
  );

  return false;
};

export const intersectsOtherSolid = (
  scene: BaseScene,
  obj: Part,
  ignore: Part[] = [],
): Part | null => {
  if (obj.noCollide) return null;

  ignore.push(obj);

  const parts = _.difference(scene.getParts(), ignore);

  const geom = obj.geom;
  for (const part of parts)
    if (!part.noCollide && intersectsGeoms(geom, part.geom)) return part;
  return null;
};

export const mergeGeoms = (
  geoms: (Phaser.Geom.Polygon | Phaser.Geom.Rectangle | Phaser.Geom.Ellipse)[],
): Phaser.Geom.Polygon => {
  if (geoms.length < 2) throw new Error(`mergeGeoms size must be >= 2`);

  let shapes = geoms.map((geom) => {
    if (geom instanceof Phaser.Geom.Polygon)
      return new Flatten.Polygon(geom.points.map((p) => [p.x, p.y]));
    if (geom instanceof Phaser.Geom.Rectangle)
      return new Flatten.Polygon([
        [geom.right, geom.top],
        [geom.right, geom.bottom],
        [geom.left, geom.bottom],
        [geom.left, geom.top],
      ]);
    if (geom instanceof Phaser.Geom.Ellipse)
      return new Flatten.Polygon(
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        getEllipsePoints(geom.x, geom.y, geom.width, geom.height).map((p) => [
          p.x,
          p.y,
        ]),
      );
    throw new Error(
      `Unsupported type in mergeGeoms: ${GEOM_NAMES[(geom as any).type]}`,
    );
  });

  shapes = shapes.map((s) => {
    // make sure all polygons orient the same way (the orientation we choose is arbitrary)
    const orient = firstIterableValue(s.faces).orientation();
    if (orient === Flatten.ORIENTATION.CW) {
      return s.reverse();
    }

    return s;
  });

  let merged = shapes
    .slice(1)
    .reduce((a, b) => Flatten.BooleanOperations.unify(a, b), shapes[0]);

  // this seems to fix the faces after merging:
  try {
    merged = merged.splitToIslands()[0];
  } catch {}

  if (!merged.isValid()) console.warn('Merged polygon is not valid');

  return new Phaser.Geom.Polygon(merged.vertices);
};

export const groupByIntersection = (objs: Part[]): Part[][] => {
  const intersects = _.memoize(
    (a, b) => intersectsGeoms(a.geom, b.geom),
    (a, b) => [a.id, b.id].sort().join(':'),
  );

  const ungrouped = [...objs];

  const groups: Part[][] = [];

  // eslint-disable-next-line no-restricted-syntax
  outer: while (ungrouped.length > 0) {
    const a = ungrouped.pop()!;
    for (const g of groups) {
      for (const b of g) {
        if (intersects(a, b)) {
          g.push(a);
          continue outer;
        }
      }
    }
    for (const b of ungrouped) {
      if (intersects(a, b)) {
        _.pull(ungrouped, b); // remove b from `ungrouped`
        groups.push([a, b]);
        continue outer;
      }
    }

    // `a` has no intersections
    groups.push([a]);
  }

  return groups;
};

export const getTopObject = (scene: BaseScene, x: number, y: number) => {
  const point = new Phaser.Geom.Point(x, y);

  const children = scene.getParts();
  for (let i = children.length - 1; i >= 0; i--) {
    const obj = children[i];

    if (intersectsGeoms(point, obj.geom)) return obj;
  }

  return null;
};

export const anySame = (
  objA: Record<string, any>,
  objB: Record<string, any>,
) => {
  for (const key in objA) if (key in objB) return true;
  return false;
};

export function* valuesIterator<T>(obj: Record<string, T>) {
  for (const k in obj) yield obj[k];
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

type Emitter = any;

export class EventManager {
  events: {
    off: string;
    eventName: string;
    eventEmitter: Emitter;
    cb: (...args: any[]) => any;
  }[] = [];

  on(eventEmitter: Emitter, eventName: string, cb: (...args: any[]) => any) {
    const [on, off] =
      'on' in eventEmitter
        ? ['on', 'off']
        : 'addListener' in eventEmitter
        ? ['addListener', 'removeListener']
        : ['addEventListener', 'removeEventListener'];

    eventEmitter[on](eventName, cb);
    this.events.push({ off, eventName, eventEmitter, cb });

    return this;
  }

  off(
    eventEmitter?: Emitter,
    eventName?: string,
    cb?: (...args: any[]) => any,
  ) {
    this.events = this.events.filter((e) => {
      if (cb) {
        if (
          cb !== e.cb ||
          eventName !== e.eventName ||
          eventEmitter !== e.eventEmitter
        )
          return true;
      } else if (eventName) {
        if (eventName !== e.eventName || eventEmitter !== e.eventEmitter)
          return true;
      } else if (eventEmitter) {
        if (eventEmitter !== e.eventEmitter) return true;
      }

      e.eventEmitter[e.off](e.eventName, e.cb);
      return false;
    });

    return this;
  }
}

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

function* iterateBoundPoints(rect: Phaser.Geom.Rectangle, angle: number) {
  const rotateAround = factoryRotateAround(
    { x: rect.centerX ?? rect.x, y: rect.centerY ?? rect.y },
    angle,
  );

  yield rotateAround({ x: rect.left, y: rect.top });
  yield rotateAround({ x: rect.right, y: rect.top });
  yield rotateAround({ x: rect.right, y: rect.bottom });
  yield rotateAround({ x: rect.left, y: rect.bottom });
}

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

export const getBoundPoints = (
  rect: Phaser.Geom.Rectangle,
  angle: number,
): Point[] => Array.from(iterateBoundPoints(rect, angle));

export const getObjectsBounds = (
  objs: Part[],
): Phaser.Geom.Rectangle | null => {
  const o = objs[0];
  if (!o) return null;

  const tempBounds = new Phaser.Geom.Rectangle();

  const bounds = new Phaser.Geom.Rectangle(o.x, o.y, 0, 0);

  for (const obj of objs) {
    const r = obj.rotation ?? 0;
    const b = obj.getBounds(tempBounds);

    for (const p of iterateBoundPoints(b, r)) {
      if (p.x > bounds.right) bounds.right = p.x;
      if (p.y > bounds.bottom) bounds.bottom = p.y;
      if (p.x < bounds.left) bounds.left = p.x;
      if (p.y < bounds.top) bounds.top = p.y;
    }

    // if (b.right > bounds.right) bounds.right = b.right;
    // if (b.bottom > bounds.bottom) bounds.bottom = b.bottom;
    // if (b.left < bounds.left) bounds.left = b.left;
    // if (b.top < bounds.top) bounds.top = b.top;
  }

  return bounds;
};

export const fitCameraToObjs = (
  camera: Phaser.Cameras.Scene2D.Camera,
  objs: Part[],
  { padding = 50, minWidth = 800 } = {},
) => {
  if (objs.length === 0) return;

  const bounds = getObjectsBounds(objs);
  if (!bounds) return;

  if (bounds.width < minWidth) padding += (minWidth - bounds.width) / 2;

  if (padding) {
    bounds.x -= padding;
    bounds.y -= padding;
    bounds.width += padding * 2;
    bounds.height += padding * 2;
  }

  camera.setScroll(
    bounds.centerX - camera.width / 2,
    bounds.centerY - camera.height / 2,
  );
  camera.setZoom(camera.width / bounds.width);
};

export const addHoverCursor = (
  obj: Phaser.GameObjects.Shape,
  cursor: CSSStyleDeclaration['cursor'],
) => {
  const canvas = obj.scene.game.canvas;
  obj
    .on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => {
      canvas.style.cursor = cursor;
    })
    .on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
      canvas.style.cursor = 'auto';
    });
};

const deterministicColor = (seed: string): number => {
  const rng = new Phaser.Math.RandomDataGenerator([seed]);
  return Phaser.Display.Color.HSLToColor(rng.frac(), 1, 0.5).color;
};

export const debugShape = (
  scene: BaseScene,
  key: string,
  shape: Phaser.Geom.Rectangle | Point,
) => {
  if (shape instanceof Phaser.Geom.Rectangle) {
    const debug = ((scene.debugShapes ||= {})[key] ||= scene.add
      .rectangle(0, 0, 1, 1, 0, 0)
      .setStrokeStyle(4, deterministicColor(key))
      .setOrigin(0, 0)) as Phaser.GameObjects.Rectangle;
    debug.setPosition(shape.x, shape.y).setSize(shape.width, shape.height);
    return debug;
  } else if (validPoint(shape)) {
    const debug = ((scene.debugShapes ||= {})[key] ||= scene.add.circle(
      0,
      0,
      4,
      deterministicColor(key),
      1,
    ));
    debug.setPosition(shape.x, shape.y);
    return debug;
  }
  return null;
};
