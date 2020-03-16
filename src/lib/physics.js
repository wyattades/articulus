/// <reference path="../typings/global.d.ts" />
import Phaser from 'phaser';

import { nextId, anySame, getFirstValue } from './utils';

/**
 * @type {import('@types/matter-js')}
 */
export const Matter = Phaser.Physics.Matter.Matter;

/**
 * @param {Record<number, FC.Joint>} joints
 * @param {FC.Body} a
 * @param {FC.Body} b
 * @param {FC.Body} x
 * @param {FC.Body} y
 */
const getJoint = (joints, a, b, x, y) => {
  const bodies = [a, b];
  for (const id in joints) {
    const joint = joints[id];
    for (const body of bodies) {
      if (body.id in joint.bodies) {
        for (const c of joint.constraints) {
          for (const [cBody, cPoint] of [
            [c.bodyA, c.pointA],
            [c.bodyB, c.pointB],
          ]) {
            if (cBody === body) {
              const { x: cx, y: cy } = cBody.position;
              const { x: dx, y: dy } = cPoint;
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

/**
 * @param {FC.Joint} joint
 * @param {FC.Body} body
 */
export const getJointPos = (joint, body = getFirstValue(joint.bodies)) => {
  if (!body) {
    console.warn('No bodies!', joint);
    return null;
  }

  const con = joint.constraints[0];
  if (!con) {
    console.warn('No constraints!', joint);
    return null;
  }

  return {
    x: con.pointA.x + con.bodyA.position.x,
    y: con.pointA.y + con.bodyA.position.y,
  };
};

/**
 * @param {Phaser.Scene} scene
 * @param {FC.Joint} joint
 * @param {{ x: number, y: number }} [point=null]
 */
const reconnect = (scene, joint, point = null) => {
  const bodyA = getFirstValue(joint.bodies);

  if (!point) point = getJointPos(joint, bodyA);
  if (!point) return;

  const { x, y } = point;

  while (joint.constraints.length > 0)
    scene.matter.world.removeConstraint(joint.constraints.pop());

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

const oldCanCollide = Matter.Detector.canCollide;
/**
 * @param {FC.CollisionFilter} filterA
 * @param {FC.CollisionFilter} filterB
 */
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
 * Connects two bodies at position of `point`
 * @param {Phaser.Scene} scene
 * @param {FC.Body} bodyA
 * @param {FC.Body} bodyB
 * @param {{ x: number, y: number }} point
 */
export const stiffConnect = (scene, bodyA, bodyB, point) => {
  const { x, y } = point;

  let joint = getJoint(scene.partJoints, bodyA, bodyB, x, y);
  if (!joint) {
    const newId = nextId();
    scene.partJoints[newId] = joint = {
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
 * Delete all of the body's connections
 * @param {Phaser.Scene} scene
 * @param {Matter.Body} body
 */
export const deleteConnections = (scene, body) => {
  for (const jId in body.collisionFilter.joints) {
    const joint = body.collisionFilter.joints[jId];
    delete joint.bodies[body.id];

    reconnect(scene, joint);

    const bodies = Object.values(joint.bodies);

    const jointPos = getJointPos(joint) || {};

    if (bodies.length <= 1) {
      delete scene.partJoints[jId]; // is this safe?
      for (const b of bodies) {
        b.gameObject.onDisconnect(jointPos); // FIXME: use joint id, not position!
        delete b.collisionFilter.joints[jId];
      }
    }
  }
};

/**
 * Clone the physics settings from one set of game objects (fromObjs) to another (toObjs)
 * @param {Phaser.Scene} scene
 * @param {FC.GameObject[]} fromObjs
 * @param {FC.GameObject[]} toObjs
 */
export const clonePhysics = (scene, fromObjs, toObjs) => {
  const bodiesMap = new WeakMap();

  const len = fromObjs.length;
  for (let i = 0; i < len; i++) {
    const from = fromObjs[i];
    const to = toObjs[i];
    if (!to.body) to.enablePhysics();
    if (from.body) bodiesMap.set(from.body, to.body);
  }

  for (let i = 0; i < len; i++) {
    const from = fromObjs[i].body;
    const to = toObjs[i].body;

    if (!from) continue;

    const joints = from.collisionFilter.joints;
    for (const jId in joints) {
      const joint = joints[jId];

      for (const c of joint.constraints) {
        const [cBody, cPoint] =
          c.bodyA === from ? [c.bodyB, c.pointB] : [c.bodyA, c.pointA];
        const toCBody = bodiesMap.get(cBody);
        if (toCBody) {
          // bodiesMap.delete(cBody);

          stiffConnect(scene, to, toCBody, {
            x: toCBody.position.x + cPoint.x,
            y: toCBody.position.y + cPoint.y,
          });
        }
      }
    }
  }
};
