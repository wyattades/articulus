import Phaser from 'phaser';
import * as _ from 'lodash-es';

import {
  nextId,
  anySame,
  getFirstValue,
  constrain,
  valuesIterator,
} from 'lib/utils';
import { config, CONNECTOR_RADIUS } from 'src/const';

/**
 * @type {typeof import('matter-js')}
 */
export const Matter = Phaser.Physics.Matter.Matter;

/**
 * @param {FC.Joint} joint
 * @param {FC.Body} body
 * @return {{ x: number: y: number }}
 */
export const getJointPos = (joint) => {
  const a = getFirstValue(joint.bodies);
  if (!a) return null;

  const [anchorId, body] = a;

  return body.gameObject.getAnchorById(anchorId);
};

const allConnectedBodies = (body, res = [], hitIds = {}) => {
  for (const joint of valuesIterator(body.collisionFilter.joints)) {
    for (const [_anchorId, connectedBody] of valuesIterator(joint.bodies)) {
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
  objs = _.flatten([objs]);

  const bodies = [],
    hitIds = {};

  for (const obj of objs)
    if (obj.body) allConnectedBodies(obj.body, bodies, hitIds);

  const connected = bodies.map((body) => body.gameObject);
  return (includeSelf ? _.union : _.difference)(connected, objs);
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
    const pos = getJointPos(joint);
    if (Phaser.Math.Distance.Squared(pos.x, pos.y, x, y) <= 1) return joint;
  }

  return null;
};

/**
 * @param {FC.Anchor} y
 * @param {FC.GameObject | FC.Joint} objOrJoint
 * @return {FC.AnchorJoint}
 */
export const createAnchorJoint = (anchor, objOrJoint) => {
  if (objOrJoint.bodies) return { ...anchor, joint: objOrJoint };
  else return { ...anchor, obj: objOrJoint };
};

/**
 * Runs on every tick, must be performant
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} y
 * @param {FC.GameObject} [ignore=null]
 * @return {FC.AnchorJoint}
 */
export const getHoveredJoint = (scene, x, y, ignore = null) => {
  const hoverDist = constrain(
    (CONNECTOR_RADIUS * 1.75) / scene.cameras.main.zoom,
    CONNECTOR_RADIUS,
    CONNECTOR_RADIUS * 2,
  );

  for (const child of scene.parts.getChildren()) {
    if (ignore === child) continue;

    const anchor = child.getHoveredAnchor(x, y, hoverDist);
    if (anchor) {
      const joint = getObjectJointAt(child, anchor.x, anchor.y);

      return createAnchorJoint(anchor, joint || child);
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
  if (!point) point = getJointPos(joint);
  if (!point) return false;

  const { x, y } = point;

  while (joint.constraints.length > 0)
    scene.matter.world.removeConstraint(joint.constraints.pop());

  const [, bodyA] = getFirstValue(joint.bodies);

  for (const [anchorId, bodyB] of valuesIterator(joint.bodies)) {
    bodyB.collisionFilter.joints[joint.id] = joint;
    bodyB.gameObject.onConnect(anchorId);

    if (bodyB.id !== bodyA.id) {
      const c = scene.matter.add.constraint(
        bodyA,
        bodyB,
        0,
        config.physics.jointStiffness,
        {
          render: {
            lineColor: 0xff0000,
            visible: !!scene.matter.config.debug,
          },
          pointA: {
            x: x - bodyA.position.x,
            y: y - bodyA.position.y,
          },
          pointB: {
            x: x - bodyB.position.x,
            y: y - bodyB.position.y,
          },
        },
      );

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

  return oldCanCollide(filterA, filterB);
};

const createJoint = () => {
  const newId = nextId();
  const joint = {
    id: newId,
    bodies: {},
    constraints: [],
  };
  return joint;
};

/**
 * Connects two `anchorJoint`s
 * @param {Phaser.Scene} scene
 * @param {FC.AnchorJoint} anchorJoint
 * @param {FC.GameObject} obj
 * @param {number} anchorId
 */
export const stiffConnect = (scene, anchorJoint, obj, anchorId) => {
  const newBodies = [[anchorId, obj.body]];
  const joint = anchorJoint.joint || createJoint();
  if (anchorJoint.obj) {
    newBodies.push([anchorJoint.id, anchorJoint.obj.body]);
  }

  for (const [aId, body] of newBodies) {
    joint.bodies[body.id] = [aId, body];
  }

  reconnect(scene, joint);
};

/**
 * Delete all of the body's connections
 * @param {Phaser.Scene} scene
 * @param {FC.Body | FC.Matter['Body']} body
 */
export const deleteConnections = (scene, body) => {
  for (const jId in body.collisionFilter.joints) {
    const joint = body.collisionFilter.joints[jId];
    delete joint.bodies[body.id];

    reconnect(scene, joint);

    const bodies = Object.values(joint.bodies);

    if (bodies.length <= 1) {
      for (const [anchorId, b] of bodies) {
        delete b.collisionFilter.joints[jId];
        b.gameObject.onDisconnect(anchorId);
      }
    }
  }

  body.collisionFilter.joints = null;
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
      let jointData = (jointDatas[joint.id] = jointDatas[joint.id] || []);

      const anchorId = joint.bodies[from.body.id][0];

      jointData.push([anchorId, to.body]);
    }
  }

  for (let bodies of valuesIterator(jointDatas)) {
    bodies = _.uniqBy(bodies, (a) => a[1]);

    if (bodies.length < 2) continue;

    const joint = createJoint();

    for (const [anchorId, body] of bodies) {
      joint.bodies[body.id] = [anchorId, body];
    }

    reconnect(scene, joint);
  }
};

/** @typedef {{ joints: { x: number, y: number, connections: { objId: number, anchorId: number }[] }[] }} SerialPhysics */

/**
 * @param {Phaser.Scene} scene
 * @return {SerialPhysics}
 */
export const serializePhysics = (scene) => {
  const jointMap = {};
  const bodyMap = {};
  for (const part of scene.parts.getChildren()) {
    if (part.body) {
      bodyMap[part.body.id] = part.body;
      for (const j of valuesIterator(part.body.collisionFilter.joints)) {
        jointMap[j.id] = j;
      }
    } else console.warn('serializePhysics: Missing body!', part);
  }

  const sJoints = [];

  for (const joint of valuesIterator(jointMap)) {
    const bodies = Object.values(joint.bodies).filter(
      (a) => a[1].id in bodyMap,
    );

    // how would it have <= 1 body???
    if (bodies.length > 1) {
      sJoints.push({
        connections: bodies.map(([anchorId, body]) => ({
          objId: body.gameObject.id,
          anchorId,
        })),
      });
    } else console.warn('serializePhysics: bad joint', joint);
  }

  return { joints: sJoints };
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

  for (const { connections } of data.joints) {
    const joint = createJoint();

    for (const { objId, anchorId } of connections) {
      const body = objMap[objId]?.body;
      if (!body) {
        console.warn('deserializePhysics: Missing object/body!', objId, objMap);
        continue;
      }

      joint.bodies[body.id] = [anchorId, body];
    }

    reconnect(scene, joint);
  }
};
