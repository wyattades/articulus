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
 * Connects two bodies at position of `child`
 * @param {Phaser.Scene} scene
 * @param {Matter.Body} parent
 * @param {Matter.Body} child
 */
export const stiffConnect = (scene, bodyA, bodyB, { x, y }) => {
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

        scene.matter.world.removeConstraint(c);
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
 * @param {Phaser.Scene} scene
 * @param {Matter.Body} body
 */
export const deleteConnections = (scene, body) => {
  const world = scene.matter.world.localWorld;

  for (const b of Matter.Composite.allBodies(world)) {
    if (b.collisionFilter.connections)
      delete b.collisionFilter.connections[body.id];
  }

  // FIXME: deletes ALL constraints
  for (const c of Matter.Composite.allConstraints(world)) {
    if (c.bodyA === body || c.bodyB === body)
      scene.matter.world.removeConstraint(c);
  }

  scene.matter.world.remove(body);
};
