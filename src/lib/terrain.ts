import Phaser from 'phaser';

import { Matter } from 'lib/physics';
import { midpoint } from 'lib/utils';
import { config } from 'src/const';
import type { AnyScene } from 'src/scenes';

// const retry = (fn, maxAttempts = 16) => {
//   let err;
//   for (let i = 0; i < maxAttempts; i++) {
//     try {
//       return fn();
//     } catch (e) {
//       console.warn('"retry" failed with the following error:');
//       console.error(e);
//       err = e;
//     }
//   }
//   throw err;
// };

const minMax = (items: number[]) => {
  let min = Infinity;
  let max = -Infinity;
  for (const v of items) {
    if (v > max) max = v;
    if (v < min) min = v;
  }
  return { min, max };
};

const terrain = (
  width: number,
  height: number,
  displace: number,
  roughness = 0.6,
) => {
  const points = [],
    // Gives us a power of 2 based on our width
    power = 2 ** Math.ceil(Math.log(width) / Math.log(2));

  // Set the initial left point
  points[0] = height / 2 + Math.random() * displace * 2 - displace;
  // set the initial right point
  points[power] = height / 2 + Math.random() * displace * 2 - displace;
  displace *= roughness;

  // Increase the number of segments
  for (let i = 1; i < power; i *= 2) {
    // Iterate through each segment calculating the center point
    for (let j = power / i / 2; j < power; j += power / i) {
      points[j] = (points[j - power / i / 2] + points[j + power / i / 2]) / 2;
      points[j] += Math.random() * displace * 2 - displace;
    }
    // reduce our random range
    displace *= roughness;
  }
  return points;
};

const randMap = (width: number, height: number, size = 10) => {
  const hMap = terrain(width, height, height / 2);

  const { min: minH, max: maxH } = minMax(hMap);
  const pointsH = maxH - minH;
  const terrainWidth = size * (hMap.length - 1);

  // Build points counter-clockwise so `decomp.makeCCW` has less work to do
  const points = hMap.map((y, i) => ({
    x: terrainWidth - i * size,
    y: y - minH,
  }));

  const midY = points[Math.floor(points.length / 2)].y;

  points.unshift(
    {
      x: 0,
      y: pointsH + height,
    },
    {
      x: terrainWidth,
      y: pointsH + height,
    },
  );

  return {
    points,
    width: terrainWidth,
    height: pointsH + height,
    midY,
  };
};

export class Terrain extends Phaser.GameObjects.Graphics {
  ix: number;
  iy: number;
  midY: number;
  width: number;
  height: number;
  iPoints: Point[];

  noCollide?: boolean;

  constructor(scene: AnyScene, x = 0, y = 0) {
    super(scene, { x, y });
    scene.add.existing(this);

    this.ix = x;
    this.iy = y;

    const { points, width, height, midY } = randMap(100, 1000, 40);
    this.midY = midY;
    this.width = width;
    this.height = height;

    this.fillStyle(0x876846);
    this.lineStyle(16, 0x5bad4a);

    this.beginPath();
    this.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      this.lineTo(p.x, p.y);
    }
    this.closePath();

    this.fillPath();
    this.strokePath();

    this.enablePhysics(points);

    this.iPoints = points;
    this.updateGeomCache();
  }

  _geom?: Phaser.Geom.Polygon;
  updateGeomCache() {
    if (!this.iPoints) return;
    const { x, y } = this;
    this._geom = new Phaser.Geom.Polygon(
      this.iPoints.map((p) => ({ x: p.x + x, y: p.y + y })),
    );
  }

  get geom() {
    return this._geom;
  }

  getBounds(): never {
    throw new Error('Not implemented');
  }

  enablePhysics(points: Point[]) {
    const ix = this.x,
      iy = this.y;

    this.scene.matter.add.gameObject(this, {
      density: config.physics.landDensity,
      isStatic: true,
      shape: {
        type: 'fromVertices',
        verts: points.map((p) => ({ x: p.x, y: p.y })),
      },
    });

    const body = this.body as unknown as FC.Body;

    // Get offset of center of mass and set the body to its correct position
    // https://github.com/liabru/matter-js/issues/211#issuecomment-184804576
    // (this is only strictly necessary on Polygon object b/c it's the only one of our shapes that can have a non-centered center-of-mass)
    const centerOfMass = Matter.Vector.sub(
      midpoint(body.bounds.max, body.bounds.min),
      Matter.Vector.add(body.position, {
        x: this.width / 2,
        y: this.height / 2,
      }),
    );
    Matter.Body.setCentre(body, centerOfMass, true);
    this.setPosition(ix, iy);
    // equivalent to: this.setPosition(this.x - centerOfMass.x, this.y - centerOfMass.y);
  }
}
