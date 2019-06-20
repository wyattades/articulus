import Phaser from 'phaser';

/**
 * @type import('@types/matter-js')
 */
export const Matter = Phaser.Physics.Matter.Matter;

const oldCanCollide = Matter.Detector.canCollide;
Matter.Detector.canCollide = (filterA, filterB) => {
  if (
    (filterA.noCollide && filterB.group < 0) ||
    (filterB.noCollide && filterA.group < 0)
  )
    return false;
  if (
    (filterA.connections && filterA.connections.includes(filterB.group)) ||
    (filterB.connections && filterB.connections.includes(filterA.group))
  )
    return false;
  return oldCanCollide(filterA, filterB);
};

// {
//   pointA: {
//     x: line.x2 - parent.x,
//     y: line.y2 - parent.y,
//   },
// }

/**
 * @param {Phaser.Scene} scene
 * @param {import('@types/matter-js').Body} bodyA
 * @param {import('@types/matter-js').Body} bodyB
 * @param {number} x
 * @param {number} y
 */
const getConnectedBodies = (scene, bodyA, bodyB, x, y) => {
  const bodies = new Set([bodyA, bodyB]); // unique

  for (const group of (bodyA.collisionFilter.connections || []).concat(
    bodyB.collisionFilter.connections || [],
  )) {
    const obj = Matter.Composite.allBodies(scene.matter.world.localWorld).find(
      (b) => b.collisionFilter.group === group,
    );
    if (obj) {
      const point = obj.gameObject.getHoverPoint(x, y, 0.1); // is 0.1 too small/large?
      if (point) bodies.add(obj);
    }
  }

  return bodies.values();
};

/**
 * Connects two bodies at position of `child`
 * @param {Phaser.Scene} scene
 * @param {Matter.Body} parent
 * @param {Matter.Body} child
 */
export const stiffConnect = (scene, bodyA, bodyB, options = {}) => {
  // const typeA = parent.type;
  // const typeB = child.type;
  // parent = parent.body;
  // child = child.body;

  const {
    length = 0,
    stiffness = 0.8,
    x,
    y,
    // group = Matter.Body.nextGroup(true),
    ..._options
  } = options;

  const fA = bodyA.collisionFilter;
  const fB = bodyB.collisionFilter;
  if (!fA.group) fA.group = Matter.Body.nextGroup(true);
  if (!fB.group) fB.group = Matter.Body.nextGroup(true);
  if (!fA.connections) fA.connections = [];
  if (!fA.connections.includes(fB.group)) fA.connections.push(fB.group);
  // parent.collisionFilter.group = group;
  // child.collisionFilter.group = group;

  if (!_options.render) _options.render = { visible: false };

  if (x !== undefined && y !== undefined) {
    // TODO create one constraint with multiple bodies?
    // const connections = getConnectedBodies(scene, bodyA, bodyB, x, y);

    _options.pointA = {
      x: x - bodyA.position.x,
      y: y - bodyA.position.y,
    };
    _options.pointB = {
      x: x - bodyB.position.x,
      y: y - bodyB.position.y,
    };
  }

  const b = scene.matter.add.constraint(
    bodyA,
    bodyB,
    length,
    stiffness,
    _options,
  );
  return b;
};
