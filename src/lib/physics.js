/// <reference path="../typings/global.d.ts" />
import Phaser from 'phaser';
import * as R from 'ramda';

import {
  nextId,
  anySame,
  getFirstValue,
  constrain,
  valuesIterator,
} from './utils';

/**
 * @type {import('@types/matter-js')}
 */
export const Matter = Phaser.Physics.Matter.Matter;

/**
 * @param {FC.Joint} joint
 * @param {FC.Body} body
 * @return {{ x: number: y: number }}
 */
export const getJointPos = (joint, body = getFirstValue(joint.bodies)) => {
  if (!body) return null;

  const con = joint.constraints[0];
  if (!con) return null;

  return {
    x: con.pointA.x + con.bodyA.position.x,
    y: con.pointA.y + con.bodyA.position.y,
  };
};

const allConnectedBodies = (body, res = [], hitIds = {}) => {
  for (const joint of valuesIterator(body.collisionFilter.joints)) {
    for (const c of joint.constraints) {
      const connectedBody = c.bodyA === body ? c.bodyB : c.bodyA;

      if (hitIds[connectedBody.id]) continue;
      hitIds[connectedBody.id] = true;

      res.push(connectedBody);

      allConnectedBodies(connectedBody, res, hitIds);
    }
  }

  return res;
};

/**
 * @param {FC.GameObject | FC.GameObject[]} objs
 * @return {FC.GameObject[]}
 */
export const getConnectedObjects = (objs, includeSelf = true) => {
  objs = R.flatten([objs]);

  let bodies = [],
    hitIds = {};

  for (const obj of objs)
    if (obj.body) allConnectedBodies(obj.body, bodies, hitIds);

  const connected = bodies.map((body) => body.gameObject);
  return includeSelf ? R.union(connected, objs) : R.difference(connected, objs);
};

/**
 * @param {FC.GameObject} obj
 * @param {number} x
 * @param {number} y
 * @return {FC.Joint | null}
 */
const getObjectJointAt = (obj, x, y) => {
  if (!obj.body) return null;

  for (const joint of valuesIterator(obj.body.collisionFilter.joints)) {
    const pos = getJointPos(joint, obj.body);
    if (Phaser.Math.Distance.Squared(pos.x, pos.y, x, y) <= 1) return joint;
  }

  return null;
};

/**
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} y
 * @param {FC.GameObject} [ignore=null]
 * @return {FC.AnchorJoint}
 */
export const getHoveredJoint = (scene, x, y, ignore = null) => {
  const hoverDist = constrain(10 / scene.cameras.main.zoom, 6, 24);

  for (const child of scene.parts.getChildren()) {
    if (ignore === child) continue;

    const anchor = child.getHoveredAnchor(x, y, hoverDist);
    if (anchor) {
      const joint = getObjectJointAt(child, anchor.x, anchor.y);

      if (joint) return { ...anchor, joint };
      else return { ...anchor, obj: child };
    }
  }

  return null;
};

/**
 * Resets the MatterJS connections for a joint's bodies
 * @param {Phaser.Scene} scene
 * @param {FC.Joint} joint
 * @param {{ x: number, y: number }} [point=null]
 * @return {boolean}
 */
export const reconnect = (scene, joint, point = null) => {
  const bodyA = getFirstValue(joint.bodies);

  if (!point) point = getJointPos(joint, bodyA);
  if (!point) return false;

  const { x, y } = point;

  while (joint.constraints.length > 0)
    scene.matter.world.removeConstraint(joint.constraints.pop());

  for (const body of valuesIterator(joint.bodies)) {
    if (body.id !== bodyA.id) {
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

  return true;
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
 * Connects a body to an "anchorJoint"
 * @param {Phaser.Scene} scene
 * @param {FC.Body} body
 * @param {FC.AnchorJoint} anchorJoint
 */
export const stiffConnect = (scene, body, anchorJoint) => {
  const { x, y } = anchorJoint;

  if (anchorJoint.obj) {
    const newId = nextId();
    const joint = (scene.partJoints[newId] = {
      id: newId,
      bodies: {},
      constraints: [],
    });

    for (const body of [body, anchorJoint.obj.body]) {
      joint.bodies[body.id] = body;
      body.collisionFilter.joints[joint.id] = joint;
      body.gameObject.onConnect(x, y);
    }

    return reconnect(scene, joint, { x, y });
  } else {
    const { joint } = anchorJoint;

    for (const body of [body, ...Object.values(joint.bodies)]) {
      joint.bodies[body.id] = body;
      body.collisionFilter.joints[joint.id] = joint;
      body.gameObject.onConnect(x, y);
    }

    return reconnect(scene, joint, { x, y });
  }
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

    const jointPos = getJointPos(joint);

    if (bodies.length <= 1) {
      delete scene.partJoints[jId]; // is this safe?
      for (const b of bodies) {
        // TODO: use joint.id or anchor.id, not position!
        if (jointPos) b.gameObject.onDisconnect(jointPos.x, jointPos.y);
        delete b.collisionFilter.joints[jId];
      }
    }
  }
};

/**
 * @param {FC.Joint} joint
 * @param {FC.Body} body
 */
const getJointOffset = (joint, body) => {
  for (const c of joint.constraints) {
    if (c.bodyA === body) return c.pointA;
    else if (c.bodyB === body) return c.pointB;
  }

  console.warn('No matching constraint!', joint, body);
  return null;
};

/**
 * Clone the physics settings from one set of game objects (fromObjs) to another (toObjs)
 * @param {Phaser.Scene} scene
 * @param {FC.GameObject[]} fromObjs
 * @param {FC.GameObject[]} toObjs
 */
export const clonePhysics = (scene, fromObjs, toObjs) => {
  const jointDatas = {};

  const len = fromObjs.length;
  for (let i = 0; i < len; i++) {
    const from = fromObjs[i];
    const to = toObjs[i];
    if (!to.body) to.enablePhysics();

    if (!from.body) continue;

    for (const joint of valuesIterator(from.body.collisionFilter.joints)) {
      let jointData = jointDatas[joint.id];

      if (!jointData) {
        const { x: dx, y: dy } = getJointOffset(joint, from.body);

        jointData = jointDatas[joint.id] = {
          pos: {
            x: to.body.position.x + dx,
            y: to.body.position.y + dy,
          },
          bodies: [],
        };
      }

      jointData.bodies.push(to.body);
    }
  }

  for (let { bodies, pos } of valuesIterator(jointDatas)) {
    bodies = R.uniq(bodies);

    if (bodies.length < 2) continue;

    const newId = nextId();

    const joint = (scene.partJoints[newId] = {
      id: newId,
      bodies: {},
      constraints: [],
    });

    for (const body of bodies) {
      joint.bodies[body.id] = body;
      body.collisionFilter.joints[joint.id] = joint;
      body.gameObject.onConnect(pos.x, pos.y);
    }

    reconnect(scene, joint, pos);
  }
};

const getJointPosSlow = (joint) => {
  const [{ gameObject: objA }, { gameObject: objB }] = Object.values(
    joint.bodies,
  );

  for (const { x, y } of objA.anchors()) {
    for (const { x: x2, y: y2 } of objB.anchors()) {
      if (Phaser.Math.Distance.Squared(x, y, x2, y2) <= 1) return { x, y };
    }
  }

  return null;
};

/** @typedef {{ joints: { x: number, y: number, connections: { objId: number, anchorId: number }[] }[] }} SerialPhysics */

/**
 * @param {Phaser.Scene} scene
 * @return {SerialPhysics}
 */
export const serializePhysics = (scene) => {
  const joints = [];

  for (const joint of valuesIterator(scene.partJoints)) {
    const pos = getJointPosSlow(joint);
    if (!pos) {
      console.warn('Cannot find joint pos!', joint);
      continue;
    }

    const jointData = { ...pos, connections: [] };
    joints.push(jointData);

    for (const body of valuesIterator(joint.bodies)) {
      // TODO: not resilient
      const anchor = body.gameObject.getHoveredAnchor(pos.x, pos.y, 2);
      if (!anchor) {
        console.warn('Cannot find anchor!', body.gameObject, pos);
        continue;
      }

      jointData.connections.push({
        objId: body.gameObject.id,
        anchorId: anchor.id,
      });
    }
  }

  return { joints };
};

/**
 * @param {Phaser.Scene} scene
 * @param {SerialPhysics} data
 */
export const deserializePhysics = (scene, data) => {
  const objMap = {};
  for (const obj of scene.parts.getChildren()) {
    objMap[obj.id] = obj;
  }

  for (const { connections, x, y } of data.joints) {
    const newId = nextId();

    const joint = (scene.partJoints[newId] = {
      id: newId,
      bodies: {},
      constraints: [],
    });

    for (const { objId, anchorId } of connections) {
      const obj = objMap[objId];
      if (!obj) continue;

      const body = obj.body;
      const anchor = obj.getAnchorById(anchorId);

      joint.bodies[body.id] = body;
      body.collisionFilter.joints[joint.id] = joint;
      body.gameObject.onConnect(anchor.x, anchor.y);
    }

    reconnect(scene, joint, { x, y });
  }
};
