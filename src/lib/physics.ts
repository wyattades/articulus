import * as _ from 'lodash-es';
import type MatterType from 'matter-js';
import Phaser from 'phaser';

import {
  anySame,
  constrain,
  getFirstValue,
  nextId,
  valuesIterator,
} from 'lib/utils';
import { CONNECTOR_RADIUS, config } from 'src/const';
import type { Part } from 'src/objects';
import type { AnyScene } from 'src/scenes';
import type { BaseScene } from 'src/scenes/Scene';

// the real `Matter` object:
export const Matter = (
  Phaser.Physics.Matter as unknown as { Matter: typeof MatterType }
).Matter;

export const getJointPos = (joint: FC.Joint): Point | null => {
  const a = getFirstValue(joint.bodies);
  if (!a) return null;

  const [anchorId, body] = a;

  return body.gameObject.getAnchorById(anchorId);
};

const allConnectedBodies = (
  body: FC.Body,
  res: FC.Body[] = [],
  hitIds: {
    [bodyId in number]?: boolean;
  } = {},
) => {
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

export const getConnectedObjects = (
  objs: Part | Part[],
  includeSelf = true,
): Part[] => {
  objs = Array.isArray(objs) ? objs : [objs];

  const bodies: FC.Body[] = [],
    hitIds = {};

  for (const obj of objs)
    if (obj.body) allConnectedBodies(obj.body, bodies, hitIds);

  const connected = bodies.map((body) => body.gameObject);
  return (includeSelf ? _.union : _.difference)(connected, objs);
};

const getObjectJointAt = (obj: Part, x: number, y: number): FC.Joint | null => {
  if (!obj.body) return null;

  for (const joint of valuesIterator(obj.body.collisionFilter.joints)) {
    const pos = getJointPos(joint);
    if (pos && Phaser.Math.Distance.Squared(pos.x, pos.y, x, y) <= 1)
      return joint;
  }

  return null;
};

export const createAnchorJoint = (
  anchor: FC.Anchor,
  objOrJoint: Part | FC.Joint,
): FC.AnchorJoint => {
  if ('bodies' in objOrJoint) return { ...anchor, joint: objOrJoint };
  else return { ...anchor, obj: objOrJoint };
};

/**
 * Runs on every tick, must be performant
 */
export const getHoveredJoint = (
  scene: BaseScene,
  x: number,
  y: number,
  ignore: Part | null = null,
) => {
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
 */
export const reconnectJoint = (
  scene: BaseScene,
  joint: FC.Joint,
  point: Point | null = null,
): boolean => {
  if (!point) point = getJointPos(joint);
  if (!point) return false;

  const { x, y } = point;

  while (joint.constraints.length > 0)
    scene.matter.world.removeConstraint(joint.constraints.pop()!);

  const [, bodyA] = getFirstValue(joint.bodies)!; // unsafe?

  for (const [anchorId, bodyB] of valuesIterator(joint.bodies)) {
    bodyB.collisionFilter.joints[joint.id] = joint;
    bodyB.gameObject.onConnect(anchorId);

    if (bodyB.id !== bodyA.id) {
      const c = scene.matter.add.constraint(
        // override matter's native body into phaser's matter body
        bodyA as unknown as MatterJS.BodyType,
        bodyB as unknown as MatterJS.BodyType,
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

// eslint-disable-next-line @typescript-eslint/unbound-method
const oldCanCollide = Matter.Detector.canCollide;
Matter.Detector.canCollide = (
  filterA: FC.CollisionFilter,
  filterB: FC.CollisionFilter,
) => {
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

const createJoint = (): FC.Joint => {
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
 */
export const stiffConnect = (
  scene: BaseScene,
  anchorJoint: FC.AnchorJoint,
  obj: Part,
  anchorId: number,
) => {
  if (!obj.body) throw new Error('stiffConnect: Object has no body');

  const newBodies: [anchorId: number, body: FC.Body][] = [[anchorId, obj.body]];
  const joint = anchorJoint.joint || createJoint();
  if (anchorJoint.obj) {
    const body = anchorJoint.obj.body;
    if (!body) throw new Error('stiffConnect: AnchorJoint has no body');
    newBodies.push([anchorJoint.id, body]);
  }

  for (const [aId, body] of newBodies) {
    joint.bodies[body.id] = [aId, body];
  }

  reconnectJoint(scene, joint);
};

/**
 * Delete all of the body's connections
 */
export const deleteConnections = (
  scene: BaseScene,
  body: FC.Body, // | FC.Matter['Body'],
) => {
  for (const jId in body.collisionFilter.joints) {
    const joint = body.collisionFilter.joints[jId];
    delete joint.bodies[body.id];

    reconnectJoint(scene, joint);

    const bodies = Object.values(joint.bodies);

    if (bodies.length <= 1) {
      for (const [anchorId, b] of bodies) {
        delete b.collisionFilter.joints[jId];
        b.gameObject.onDisconnect(anchorId);
      }
    }
  }

  body.collisionFilter.joints = {}; // should this be `= null`?
};

/**
 * Clone the physics settings from one set of game objects (fromObjs) to another (toObjs)
 */
export const clonePhysics = (
  scene: BaseScene,
  fromObjs: Part[],
  toObjs: Part[],
) => {
  const jointDatas: {
    [jointId in number]: [anchorId: number, body: FC.Body][];
  } = {};

  const len = fromObjs.length;
  for (let i = 0; i < len; i++) {
    const from = fromObjs[i];
    const to = toObjs[i];
    if (!to.body) to.enablePhysics();

    if (!from.body) continue;

    for (const joint of valuesIterator(from.body.collisionFilter.joints)) {
      const jointData = (jointDatas[joint.id] = jointDatas[joint.id] || []);

      const anchorId = joint.bodies[from.body.id][0];

      jointData.push([anchorId, to.body!]);
    }
  }

  for (let bodies of valuesIterator(jointDatas)) {
    bodies = _.uniqBy(bodies, (a) => a[1]);

    if (bodies.length < 2) continue;

    const joint = createJoint();

    for (const [anchorId, body] of bodies) {
      joint.bodies[body.id] = [anchorId, body];
    }

    reconnectJoint(scene, joint);
  }
};

type SerialJoint = {
  // x: number;
  // y: number;
  connections: { objId: number; anchorId: number }[];
};
export type SerialPhysics = {
  joints: SerialJoint[];
};

export const serializePhysics = (scene: AnyScene): SerialPhysics => {
  const jointMap: {
    [id in number]: FC.Joint;
  } = {};
  const bodyMap: {
    [id in number]: FC.Body;
  } = {};
  for (const part of scene.parts.getChildren()) {
    if (part.body) {
      bodyMap[part.body.id] = part.body;
      for (const j of valuesIterator(part.body.collisionFilter.joints)) {
        jointMap[j.id] = j;
      }
    } else console.warn('serializePhysics: Missing body!', part);
  }

  const sJoints: SerialJoint[] = [];

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

export const deserializePhysics = (scene: BaseScene, data: SerialPhysics) => {
  const objMap: {
    [id in number]: Part;
  } = {};
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

    reconnectJoint(scene, joint);
  }
};
