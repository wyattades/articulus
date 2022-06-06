// CREDIT: https://github.com/davidfig/intersects

// import Phaser from 'phaser';
import Flatten from '@flatten-js/core';

import { getEllipsePoints, validPoint } from './utils';

/** @typedef {{ x: number; y: number; width: number; height: number; }} Rect */

const sq = (x) => x * x;

/**
 * box-point collision
 * @param {number} x1 top-left corner of box
 * @param {number} y1 top-left corner of box
 * @param {number} w1 width of box
 * @param {number} h1 height of box
 * @param {number} x2 of point
 * @param {number} y2 of point
 * @return {boolean}
 */
const boxPoint = (x1, y1, w1, h1, x2, y2) => {
  return x2 >= x1 && x2 <= x1 + w1 && y2 >= y1 && y2 <= y1 + h1;
};

/**
 * ellipse-line collision
 * adapted from http://csharphelper.com/blog/2017/08/calculate-where-a-line-segment-and-an-ellipse-intersect-in-c/
 * @param {number} xe center of ellipse
 * @param {number} ye center of ellipse
 * @param {number} rex radius-x of ellipse
 * @param {number} rey radius-y of ellipse
 * @param {number} x1 first point of line
 * @param {number} y1 first point of line
 * @param {number} x2 second point of line
 * @param {number} y2 second point of line
 * @return {boolean}
 */
const ellipseLine = (xe, ye, rex, rey, x1, y1, x2, y2) => {
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
 * @param {Rect} ellipse
 * @param {Rect} rect
 * @return {boolean}
 */
export const EllipseToRectangle = (ellipse, rect) => {
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

/**
 * @param {Phaser.Geom.Polygon | [number, number][] | number[] | { x: number; y: number }[]} polygon
 * @returns {[number, number][]}
 */
const polygonPoints = (polygon) => {
  if (!Array.isArray(polygon)) {
    return polygon.points.map((p) => [p.x, p.y]);
  }

  const first = polygon[0];
  if (first == null) return [];

  if (Array.isArray(first) && first.length === 2) {
    return polygon;
  } else if (validPoint(first)) {
    return polygon.map((p) => [p.x, p.y]);
  } else if (typeof first === 'number') {
    const out = [];
    for (let i = 0, len = polygon.length; i < len; i += 2)
      out.push([polygon[i], polygon[i + 1]]);
    return out;
  } else {
    throw new Error(`Unknown polygonPoints element: ${first}`);
  }
};

/**
 * polygon-polygon collision
 * based on http://stackoverflow.com/questions/10962379/how-to-check-intersection-between-2-rotated-rectangles
 * Only works on convex polygons.
 * @param {number[]} points1 [x1, y1, x2, y2, ... xn, yn] of first polygon
 * @param {number[]} points2 [x1, y1, x2, y2, ... xn, yn] of second polygon
 * @return {boolean}
 */
// export const PolygonToPolygon = (points1, points2) => {
//   const a = polygonPoints(points1);
//   const b = polygonPoints(points2);

//   const polygons = [a, b];
//   let minA, maxA, projected, minB, maxB, j;
//   for (let i = 0; i < polygons.length; i++) {
//     const polygon = polygons[i];
//     for (let i1 = 0; i1 < polygon.length; i1 += 2) {
//       const i2 = (i1 + 2) % polygon.length;
//       const normal = {
//         x: polygon[i2 + 1] - polygon[i1 + 1],
//         y: polygon[i1] - polygon[i2],
//       };
//       minA = maxA = null;
//       for (j = 0; j < a.length; j += 2) {
//         projected = normal.x * a[j] + normal.y * a[j + 1];
//         if (minA === null || projected < minA) {
//           minA = projected;
//         }
//         if (maxA === null || projected > maxA) {
//           maxA = projected;
//         }
//       }
//       minB = maxB = null;
//       for (j = 0; j < b.length; j += 2) {
//         projected = normal.x * b[j] + normal.y * b[j + 1];
//         if (minB === null || projected < minB) {
//           minB = projected;
//         }
//         if (maxB === null || projected > maxB) {
//           maxB = projected;
//         }
//       }
//       if (maxA < minB || maxB < minA) {
//         return false;
//       }
//     }
//   }
//   return true;
// };

// this is a bit memory intensive
export const PolygonToPolygon = (points1, points2) =>
  Flatten.Relations.intersect(
    new Flatten.Polygon(polygonPoints(points1)),
    new Flatten.Polygon(polygonPoints(points2)),
  );

/**
 * polygon-rectangle collision
 * @param {number[]} points
 * @param {Rect} rect
 * @return {boolean}
 */
export const PolygonToRectangle = (points, rect) => {
  const rectPoints = [
    [rect.x + rect.width, rect.y],
    [rect.x + rect.width, rect.y + rect.height],
    [rect.x, rect.y + rect.height],
    [rect.x, rect.y],
  ];

  return PolygonToPolygon(points, rectPoints);
};

/**
 * polygon-ellipse collision
 * @param {number[]} points
 * @param {Rect} ellipse
 * @return {boolean}
 */
export const PolygonToEllipse = (points, ellipse) => {
  return PolygonToPolygon(
    points,
    getEllipsePoints(ellipse.x, ellipse.y, ellipse.width, ellipse.height),
  );
};
