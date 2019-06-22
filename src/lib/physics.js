import Phaser from 'phaser';

/**
 * @type {import('@types/matter-js')}
 */
export const Matter = Phaser.Physics.Matter.Matter;

const oldCanCollide = Matter.Detector.canCollide;
Matter.Detector.canCollide = (filterA, filterB) => {
  if ((filterA.noCollide && filterB.id) || (filterB.noCollide && filterA.id))
    return false;
  if (
    (filterA.connections && filterB.id in filterA.connections) ||
    (filterB.connections && filterA.id in filterB.connections)
  )
    return false;
  return oldCanCollide(filterA, filterB);
};

/**
 * @param {Phaser.Scene} scene
 * @param {Matter.Body} bodyA
 * @param {Matter.Body} bodyB
 * @param {number} x
 * @param {number} y
 */
const reconnectedBodies = (scene, bodyA, bodyB, x, y) => {
  const world = scene.matter.world.localWorld;

  const ids = {
    [bodyA.id]: true,
    [bodyB.id]: true,
  };
  const bodies = new Set([bodyA, bodyB]); // unique
  for (const c of Matter.Composite.allConstraints(world)) {
    for (const [L, body] of [['A', c.bodyA], ['B', c.bodyB]]) {
      const { x: cx, y: cy } = body.position;
      const { x: dx, y: dy } = c[`point${L}`];
      if (Phaser.Math.Distance.Squared(x, y, cx + dx, cy + dy) <= 1.0) {
        bodies.add(body);
        ids[body.id] = true;

        Matter.Composite.remove(world, c);
      }
    }
  }

  bodies.delete(bodyA);

  for (const body of bodies) {
    Object.assign(body.collisionFilter.connections, ids);

    scene.matter.add.constraint(bodyA, body, 0, 0.8, {
      render: {
        visible: false,
      },
      pointA: {
        x: x - bodyA.position.x,
        y: y - bodyA.position.y,
      },
      pointB: {
        x: x - body.position.x,
        y: y - body.position.y,
      },
    });
  }
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

  // const fA = bodyA.collisionFilter;
  // const fB = bodyB.collisionFilter;
  // if (!fA.group) fA.group = Matter.Body.nextGroup(true);
  // if (!fB.group) fB.group = Matter.Body.nextGroup(true);
  // if (!fA.connections) fA.connections = {};
  // fA.connections[fB.id] = true;
  // parent.collisionFilter.group = group;
  // child.collisionFilter.group = group;

  if (!_options.render) _options.render = { visible: false };

  if (x !== undefined && y !== undefined) {
    reconnectedBodies(scene, bodyA, bodyB, x, y);

    // _options.pointA = {
    //   x: x - bodyA.position.x,
    //   y: y - bodyA.position.y,
    // };
    // _options.pointB = {
    //   x: x - bodyB.position.x,
    //   y: y - bodyB.position.y,
    // };
  } else {
    throw new Error('Not supported :(');
  }

  // const b = scene.matter.add.constraint(
  //   bodyA,
  //   bodyB,
  //   length,
  //   stiffness,
  //   _options,
  // );
  // return b;
};
