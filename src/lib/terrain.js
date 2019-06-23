import Phaser from 'phaser';
import { Matter } from './physics';

// const svgPath =
//   'M -10.837105,399.91531 C -10.837105,399.91531 360.95089,618.41855 633.74796,640.65452 933.27973,665.06975 1194.6484,497.3518 1498.1559,507.62844 1727.0472,515.37863 1898.3125,665.99098 2109.7652,650.73232 2479.5945,624.04507 2737.3742,278.22805 3107.1744,251.27988 3425.2674,283.59165 3926.4207,433.05255 4489.1112,512.4571 4597.6107,527.76814 4722.879,469.1338 4833.3691,482.03476 4868.8117,486.17313 4939.2658,567.09253 4974.475,571.28218 5639.6416,650.43241 6256.8855,671.72797 6588.8994,674.43736 6943.2645,673.42027 7277.3722,403.89083 7743.1187,388.41574 8023.5431,379.09821 8167.268,733.32913 8445.1661,682.98562 9142.1521,556.72082 9382.633,653.43022 9660.1193,642.80088 9803.5716,637.30582 10351.968,200.05637 10670.53,200.2844 10999.895,200.52023 11134.798,-19.470908 11345.368,0.88878878 11664.594,31.754353 12026.765,223.6594 12296.609,161.811 12838.032,37.716588 12837.788,533.42456 12847.221,532.71357';

const minMax = (items) => {
  let min = Infinity;
  let max = -Infinity;
  for (const v of items) {
    if (v > max) max = v;
    if (v < min) min = v;
  }
  return { min, max };
};

const terrain = (width, height, displace, roughness = 0.6) => {
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

const randMap = (width, height, size = 10) => {
  const hMap = terrain(width, height, height / 2);

  const { min: minH, max: maxH } = minMax(hMap);
  const pointsH = maxH - minH;

  const points = hMap.map((y, i) => ({
    x: i * size,
    y: y - minH,
  }));
  points.push(
    {
      x: size * hMap.length,
      y: pointsH + height,
    },
    {
      x: 0,
      y: pointsH + height,
    },
    { x: points[0].x, y: points[0].y },
  );
  return { points, width: hMap.length * size, height: pointsH + height };
};

// function* randMap(size, dist, smooth = false) {
//   const r = new Phaser.Math.RandomDataGenerator();

//   let y = 0,
//     dy = 0;
//   for (let i = 0; i < size; i++) {
//     r.
//     y += dy + (Math.random() * 10;
//     yield [i * dist, y];
//   }
// }

/**
 * @param {Phaser.Scene} scene
 */
export const init = (scene) => {
  const { points, width, height } = randMap(100, 1000, 40);

  const x = -width / 2,
    y = height / 8;

  const g = scene.add.graphics({ x, y });
  g.setDefaultStyles({
    lineStyle: {
      width: 16,
      color: 0x5bad4a,
      // alpha: 1,
    },
  });
  // g.beginPath();
  g.moveTo(points[0].x, points[0].y);
  for (const p of points) g.lineTo(p.x, p.y);
  // g.closePath();

  g.fillStyle(0x876846);
  g.fillPath();
  // g.lineStyle(4, 0x5bad4a);
  g.strokePath();

  const body = scene.matter.add.fromVertices(0, 0, points, {
    isStatic: true,
  });

  // Get offset of center of mass and set the terrain to its correct position
  // https://github.com/liabru/matter-js/issues/211#issuecomment-184804576
  const centerOfMass = Matter.Vector.sub(body.bounds.min, body.position);
  Matter.Body.setPosition(body, {
    x: Math.abs(centerOfMass.x) + x,
    y: Math.abs(centerOfMass.y) + y,
  });
};
