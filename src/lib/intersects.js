// CREDIT: https://github.com/davidfig/intersects

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
