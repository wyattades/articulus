import Phaser from 'phaser';

export const constrain = (v, min, max) => (v < min ? min : v > max ? max : v);

const shifts = [0, 8, 16];
export const adjustBrightness = (color, n) =>
  shifts.reduce(
    (r, i) => r + (constrain(((color & (255 << i)) >> i) + n, 0, 255) << i),
    0,
  );

let _id = 1;
export const nextId = () => _id++;

const Intersects = Phaser.Geom.Intersects;
const geomName = (g) => g.constructor.name;
export const intersectsGeoms = (g1, g2) => {
  const geoms = [g1, g2];
  const fn =
    Intersects[geoms.map(geomName).join('To')] ||
    Intersects[
      geoms
        .reverse()
        .map(geomName)
        .join('To')
    ];
  if (fn) return fn(...geoms);

  return false;
};

export const intersectsOtherSolid = (scene, obj) => {
  if (obj.noCollide) return null;

  const geom = obj.geom;
  for (const part of scene.parts.getChildren())
    if (part !== obj && !part.noCollide && intersectsGeoms(geom, part.geom))
      return part;

  return null;
};
