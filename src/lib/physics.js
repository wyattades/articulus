import Phaser from 'phaser';

import { nextId } from './utils';

const joints = {};

const getJoint = (a, b, x, y) => {
  for (const id in joints) {
    const joint = joints[id];
    for (const body of [a, b]) {
      if (body.id in joint.bodies) {
        for (const c of joint.constraints) {
          for (const [L, cBody] of [['A', c.bodyA], ['B', c.bodyB]]) {
            if (cBody === body) {
              const { x: cx, y: cy } = cBody.position;
              const { x: dx, y: dy } = c[`point${L}`];
              if (Phaser.Math.Distance.Squared(x, y, cx + dx, cy + dy) <= 1.0) {
                return joint;
              }
            }
          }
        }
      }
    }
  }
  return null;
};

const anySame = (objA, objB) => {
  for (const key in objA) if (key in objB) return true;
  return false;
};

const getFirstValue = (obj) => {
  for (const id in obj) return obj[id];
  return null;
};

const reconnect = (scene, joint, point) => {
  // const bodies = Object.values(joint.bodies);
  const bodyA = getFirstValue(joint.bodies);
  if (!bodyA) return;

  if (!point) {
    const con = joint.constraints[0];
    if (!con) return; // NOTE: when does this happen?

    point = {
      x: con.pointA.x + con.bodyA.position.x,
      y: con.pointA.y + con.bodyA.position.y,
    };
  }

  const { x, y } = point;

  for (const c of joint.constraints) scene.matter.world.removeConstraint(c);
  joint.constraints = [];

  for (const id in joint.bodies) {
    if (id !== bodyA.id) {
      const body = joint.bodies[id];

      const c = scene.matter.add.constraint(bodyA, body, 0, 0.8, {
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
      joint.constraints.push(c);
    }
  }
};

/**
 * @type {import('@types/matter-js')}
 */
export const Matter = Phaser.Physics.Matter.Matter;

const oldCanCollide = Matter.Detector.canCollide;
Matter.Detector.canCollide = (filterA, filterB) => {
  if ((filterA.noCollide && filterB.id) || (filterB.noCollide && filterA.id))
    return false;
  if (
    filterA.joints &&
    filterB.joints &&
    anySame(filterA.joints, filterB.joints)
  )
    return false; // FIXME: slow!
  // if (
  //   (filterA.connections && filterB.id in filterA.connections) ||
  //   (filterB.connections && filterA.id in filterB.connections)
  // )
  //   return false;
  return oldCanCollide(filterA, filterB);
};

/**
 * Connects two bodies at position of `child`
 * @param {Phaser.Scene} scene
 * @param {Matter.Body} parent
 * @param {Matter.Body} child
 */
export const stiffConnect = (scene, bodyA, bodyB, point) => {
  const { x, y } = point;

  let joint = getJoint(bodyA, bodyB, x, y);
  if (!joint) {
    const newId = nextId();
    joints[newId] = joint = {
      id: newId,
      bodies: {},
      constraints: [],
    };
  }

  for (const body of [bodyA, bodyB]) {
    joint.bodies[body.id] = body;
    body.collisionFilter.joints[joint.id] = joint;
    body.gameObject.onConnect(point);
  }

  reconnect(scene, joint, point);
};

/**
 * @param {Phaser.Scene} scene
 * @param {Matter.Body} body
 */
export const deleteConnections = (scene, body) => {
  for (const jId in body.collisionFilter.joints) {
    const joint = body.collisionFilter.joints[jId];
    delete joint.bodies[body.id];

    const prevBodies = Object.values(joint.bodies);

    reconnect(scene, joint);

    if (Object.values(joint.bodies).length <= 1) {
      delete joints[jId]; // is this safe?
      for (const b of prevBodies) delete b.collisionFilter.joints[jId];
    }
  }

  scene.matter.world.remove(body);
};
