import { Matter } from './physics';

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
  const terrainWidth = size * (hMap.length - 1);

  // Build points counter-clockwise so `decomp.makeCCW` has less work to do
  const points = hMap.map((y, i) => ({
    x: terrainWidth - i * size,
    y: y - minH,
  }));

  const midY = points[Math.floor(points.length / 2)].y;

  points.unshift(
    // { x: 0, y: points[0].y },
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

/**
 * @param {Phaser.Scene} scene
 */
export const init = (scene) => {

    const { points, width, midY } = randMap(100, 1000, 40);

    const x = -width / 2 + scene.scale.width / 2,
      y = scene.scale.height - midY - 100;

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

    const g = scene.add.graphics({ x, y: 0 });

    g.fillStyle(0x876846);
    g.lineStyle(16, 0x5bad4a);

    g.beginPath();
    g.moveTo(points[0].x, points[0].y + y);
    for (const p of points) g.lineTo(p.x, p.y + y);
    g.closePath();

    g.fillPath();
    g.strokePath();
};
