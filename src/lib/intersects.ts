// CREDIT: https://github.com/davidfig/intersects

import Phaser from 'phaser';
import Flatten from '@flatten-js/core';

import { Geom, GEOM_NAMES } from './geom';
// eslint-disable-next-line import/no-cycle
import { getEllipsePoints, validPoint } from './utils';

const ELLIPSE_POINTS = 16;

const sq = (x: number) => x * x;

/**
 * box-point collision
 * @param x1 top-left corner of box
 * @param y1 top-left corner of box
 * @param w1 width of box
 * @param h1 height of box
 * @param x2 of point
 * @param y2 of point
 */
const boxPoint = (
  x1: number,
  y1: number,
  w1: number,
  h1: number,
  x2: number,
  y2: number,
): boolean => {
  return x2 >= x1 && x2 <= x1 + w1 && y2 >= y1 && y2 <= y1 + h1;
};

/**
 * ellipse-line collision
 * credit: https://github.com/davidfig/intersects
 * adapted from http://csharphelper.com/blog/2017/08/calculate-where-a-line-segment-and-an-ellipse-intersect-in-c/
 * @param xe center of ellipse
 * @param ye center of ellipse
 * @param rex radius-x of ellipse
 * @param rey radius-y of ellipse
 * @param x1 first point of line
 * @param y1 first point of line
 * @param x2 second point of line
 * @param y2 second point of line
 */
const ellipseLine = (
  xe: number,
  ye: number,
  rex: number,
  rey: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): boolean => {
  x1 -= xe;
  x2 -= xe;
  y1 -= ye;
  y2 -= ye;

  const A = sq(x2 - x1) / rex / rex + sq(y2 - y1) / rey / rey;
  const B = (2 * x1 * (x2 - x1)) / rex / rex + (2 * y1 * (y2 - y1)) / rey / rey;
  const C = (x1 * x1) / rex / rex + (y1 * y1) / rey / rey - 1;
  const D = B * B - 4 * A * C;
  if (D === 0) {
    const t = -B / 2 / A;
    return t >= 0 && t <= 1;
  } else if (D > 0) {
    const sqrt = Math.sqrt(D);
    const t1 = (-B + sqrt) / 2 / A;
    const t2 = (-B - sqrt) / 2 / A;
    return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
  } else {
    return false;
  }
};

/**
 * ellipse-rectangle (axis-oriented rectangle) collision
 * credit: https://github.com/davidfig/intersects
 */
const EllipseToRectangle = (ellipse: Box, rect: Box): boolean => {
  const { x: xe, y: ye, width: we, height: he } = ellipse;
  const { x: xb, y: yb, width: wb, height: hb } = rect;
  const rex = we / 2;
  const rey = he / 2;
  return (
    boxPoint(xb, yb, wb, hb, xe, ye) ||
    ellipseLine(xe, ye, rex, rey, xb, yb, xb + wb, yb) ||
    ellipseLine(xe, ye, rex, rey, xb, yb + hb, xb + wb, yb + hb) ||
    ellipseLine(xe, ye, rex, rey, xb, yb, xb, yb + hb) ||
    ellipseLine(xe, ye, rex, rey, xb + wb, yb, xb + wb, yb + hb)
  );
};

type PointsInput =
  | Phaser.Geom.Polygon
  | [number, number][]
  | number[]
  | { x: number; y: number }[];

const polygonPoints = (polygon: PointsInput): [number, number][] => {
  if (!Array.isArray(polygon)) {
    return polygon.points.map((p) => [p.x, p.y]);
  }

  const first = polygon[0];
  if (first == null) return [];

  if (Array.isArray(first) && first.length === 2) {
    return polygon as [number, number][];
  } else if (validPoint(first)) {
    return (polygon as Point[]).map((p) => [p.x, p.y] as [number, number]);
  } else if (typeof first === 'number') {
    const out: [number, number][] = [];
    for (let i = 0, len = polygon.length; i < len; i += 2)
      out.push([(polygon as number[])[i], (polygon as number[])[i + 1]]);
    return out;
  } else {
    throw new Error(`Unknown polygonPoints element: ${first}`);
  }
};

/**
 * polygon-rectangle collision.
 * this is a bit memory intensive
 */
const PolygonToPolygon = (
  points1: PointsInput,
  points2: PointsInput,
): boolean =>
  Flatten.Relations.intersect(
    new Flatten.Polygon(polygonPoints(points1)),
    new Flatten.Polygon(polygonPoints(points2)),
  );

/**
 * polygon-rectangle collision
 */
const PolygonToRectangle = (points: PointsInput, rect: Box) => {
  const rectPoints: [number, number][] = [
    [rect.x + rect.width, rect.y],
    [rect.x + rect.width, rect.y + rect.height],
    [rect.x, rect.y + rect.height],
    [rect.x, rect.y],
  ];

  return PolygonToPolygon(points, rectPoints);
};

/**
 * polygon-ellipse collision
 */
const PolygonToEllipse = (points: PointsInput, ellipse: Box) => {
  return PolygonToPolygon(
    points,
    getEllipsePoints(
      ellipse.x,
      ellipse.y,
      ellipse.width,
      ellipse.height,
      0,
      ELLIPSE_POINTS,
    ),
  );
};

/**
 * polygon-circle collision
 */
const PolygonToCircle = (points: PointsInput, circle: Circle) => {
  return PolygonToEllipse(points, {
    x: circle.x,
    y: circle.y,
    width: circle.radius * 2,
    height: circle.radius * 2,
  });
};

/**
 * polygon-segment collision
 */
const PolygonToLine = (points: PointsInput, line: LineSegment) =>
  Flatten.Relations.intersect(
    new Flatten.Segment(
      new Flatten.Point(line.x1, line.y1),
      new Flatten.Point(line.x2, line.y2),
    ),
    new Flatten.Polygon(polygonPoints(points)),
  );

/**
 * ellipse-ellipse collision
 * TODO: use more efficient method
 */
const EllipseToEllipse = (ellipse1: Box, ellipse2: Box) => {
  return PolygonToPolygon(
    getEllipsePoints(
      ellipse1.x,
      ellipse1.y,
      ellipse1.width,
      ellipse1.height,
      0,
      ELLIPSE_POINTS,
    ),
    getEllipsePoints(
      ellipse2.x,
      ellipse2.y,
      ellipse2.width,
      ellipse2.height,
      0,
      ELLIPSE_POINTS,
    ),
  );
};

/**
 * ellipse-circle collision
 */
const EllipseToCircle = (ellipse1: Box, circle: Circle) => {
  const width = circle.radius * 2;
  return EllipseToEllipse(ellipse1, {
    x: circle.x,
    y: circle.y,
    width,
    height: width,
  });
};

/**
 * ellipse-segment collision
 */
const EllipseToLine = (ellipse: Phaser.Geom.Ellipse, line: LineSegment) => {
  // first check if line is inside ellipse
  if (ellipse.contains(line.x1, line.y1)) return true;

  return ellipseLine(
    ellipse.x,
    ellipse.y,
    ellipse.width / 2,
    ellipse.height / 2,
    line.x1,
    line.y1,
    line.x2,
    line.y2,
  );
};

const POINT_THICKNESS = 6;

const { PointToLine } = Phaser.Geom.Intersects;

const fromEntries = <Pair extends readonly [any, any]>(
  pairs: Pair[],
): { [key in Pair[0]]: Pair[1] } => Object.fromEntries(pairs);

const containsPointNames = [
  'Circle',
  'Ellipse',
  'Polygon',
  'Rectangle',
] as const;

const ContainsPoint = (
  point: Point,
  geom: InstanceType<(typeof Phaser.Geom)[(typeof containsPointNames)[number]]>,
) => geom.contains(point.x, point.y);

type GeomName = (typeof GEOM_NAMES)[keyof typeof GEOM_NAMES];

// All available Geom intersect algorithms
const Intersects: {
  [key in `${GeomName}To${GeomName}`]?: (a: any, b: any) => boolean;
} = {
  ...Phaser.Geom.Intersects,

  PointToLine: (point: Point, line: Phaser.Geom.Line) =>
    PointToLine(point, line, POINT_THICKNESS),

  EllipseToRectangle,
  PolygonToEllipse,
  PolygonToCircle,
  PolygonToPolygon,
  PolygonToRectangle,
  PolygonToLine,
  EllipseToLine,
  EllipseToEllipse,
  EllipseToCircle,

  ...fromEntries(
    containsPointNames.map(
      (name) => [`PointTo${name}`, ContainsPoint] as const,
    ),
  ),
};

const GEOM_INDEXED_NAMES = Object.entries(GEOM_NAMES).reduce(
  (arr, [type, name]) => {
    arr[Number(type)] = name;
    return arr;
  },
  [] as ((typeof GEOM_NAMES)[number] | undefined)[],
);

const INTERSECT_MATRIX = GEOM_INDEXED_NAMES.map((a) =>
  GEOM_INDEXED_NAMES.map((b) =>
    a && b ? Intersects[`${a}To${b}`] : undefined,
  ),
);

export const intersectsGeoms = (g1: Geom, g2: Geom) => {
  let fn;

  if ((fn = INTERSECT_MATRIX[g1.type][g2.type])) return fn(g1, g2);

  if ((fn = INTERSECT_MATRIX[g2.type][g1.type])) return fn(g2, g1);

  console.error(
    'Missing intersect fn for:',
    GEOM_NAMES[g1.type],
    GEOM_NAMES[g2.type],
    INTERSECT_MATRIX,
  );

  return false;
};
