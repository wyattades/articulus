import Phaser from 'phaser';
import * as R from 'ramda';
import * as MoreIntersects from './intersects';

/**
 * @param {Number} num
 */
export const colorIntToHex = (num) =>
  `#${`00000${num.toString(16)}`.substr(-6)}`;

export const colorInverse = (num) => {
  const { red, green, blue } = Phaser.Display.Color.IntegerToColor(num);
  return red * 0.299 + green * 0.587 + blue * 0.114 > 186
    ? '#000000'
    : '#ffffff';
};

export const constrain = (v, min, max) => (v < min ? min : v > max ? max : v);

const shifts = [0, 8, 16];
export const adjustBrightness = (color, n) =>
  shifts.reduce(
    (r, i) => r + (constrain(((color & (255 << i)) >> i) + n, 0, 255) << i),
    0,
  );

let _id = 1;
export const nextId = () => _id++;

const Intersects = { ...Phaser.Geom.Intersects, ...MoreIntersects };
const geomName = (g) => g.constructor.name;
export const intersectsGeoms = (g1, g2) => {
  const geoms = [g1, g2];
  let fnName;
  const fn =
    Intersects[(fnName = geoms.map(geomName).join('To'))] ||
    Intersects[
      (fnName = geoms
        .reverse()
        .map(geomName)
        .join('To'))
    ];
  if (fn) return fn(...geoms, fnName === 'PointToLine' ? 6 : undefined);

  return false;
};

export const intersectsOtherSolid = (scene, obj, ignore = []) => {
  if (obj.noCollide) return null;

  ignore.push(obj);

  const parts = R.difference(scene.parts.getChildren(), ignore);

  const geom = obj.geom;
  for (const part of parts)
    if (!part.noCollide && intersectsGeoms(geom, part.geom)) return part;

  return null;
};

export const getHovered = (scene, x, y, ignore = null) => {
  const hoverDist = constrain(10 / scene.cameras.main.zoom, 6, 24);

  for (const child of scene.parts.getChildren()) {
    if (ignore === child) continue;

    const jointPoint = child.getHoverPoint(x, y, hoverDist);
    if (jointPoint) {
      return { x: jointPoint.x, y: jointPoint.y, obj: child };
    }
  }
  return null;
};

export const anySame = (objA, objB) => {
  for (const key in objA) if (key in objB) return true;
  // for (const key in objB) if (key in objA) return true;
  return false;
};

export const getFirstValue = (obj) => {
  for (const id in obj) return obj[id];
  return null;
};
