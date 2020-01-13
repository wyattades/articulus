import Phaser from 'phaser';
import * as R from 'ramda';

import * as MoreIntersects from './intersects';
import theme from '../styles/theme';

/**
 * @param {Number} num
 */
export const colorIntToHex = (num) =>
  `#${`00000${num.toString(16)}`.substr(-6)}`;

export const colorInverse = (num) => {
  const { red, green, blue } = Phaser.Display.Color.IntegerToColor(num);
  return red * 0.299 + green * 0.587 + blue * 0.114 > 186 ? 0x000000 : 0xffffff;
};

export const constrain = (v, min, max) => (v < min ? min : v > max ? max : v);

const shifts = [0, 8, 16];
export const adjustBrightness = (color, n) =>
  shifts.reduce(
    (r, i) => r + (constrain(((color & (255 << i)) >> i) + n, 0, 255) << i),
    0,
  );

let _id = 1;
export const nextId = () => _id++;

const genIntersectMatrix = () => {
  const POINT_THICKNESS = 6;

  const { PointToLine } = Phaser.Geom.Intersects;

  // All available Geom intersect algorithms
  const Intersects = {
    ...Phaser.Geom.Intersects,
    ...MoreIntersects,
    PointToLine: (point, line) => PointToLine(point, line, POINT_THICKNESS),
  };

  const ContainsPoint = (point, geom) => geom.contains(point.x, point.y);
  for (const name of ['Circle', 'Ellipse', 'Polygon', 'Rectangle'])
    Intersects[`PointTo${name}`] = ContainsPoint;

  // Geom `constructor.name` indexed by Geom `type`
  const TYPES = ['Circle', 'Ellipse', 'Line', 'Point', 'Polygon', 'Rectangle'];

  return TYPES.map((a) => TYPES.map((b) => Intersects[`${a}To${b}`]));
};

const INTERSECT_MATRIX = genIntersectMatrix();

export const intersectsGeoms = (g1, g2) => {
  let fn;

  if ((fn = INTERSECT_MATRIX[g1.type][g2.type])) return fn(g1, g2);

  if ((fn = INTERSECT_MATRIX[g2.type][g1.type])) return fn(g2, g1);

  console.warn(
    'Missing intersect fn for:',
    g1.constructor.name,
    g2.constructor.name,
  );

  return false;
};

export const intersectsOtherSolid = (scene, obj, ignore = []) => {
  if (obj.noCollide) return null;

  ignore.push(obj);

  const parts = R.difference(scene.parts.getChildren(), ignore);

  const geom = obj.geom;
  for (const part of parts)
    if (!part.noCollide && intersectsGeoms(geom, part.geom)) return part;
  return null;
};

export const getHovered = (scene, x, y, ignore = null) => {
  const hoverDist = constrain(10 / scene.cameras.main.zoom, 6, 24);

  for (const child of scene.parts.getChildren()) {
    if (ignore === child) continue;

    const jointPoint = child.getHoverPoint(x, y, hoverDist);
    if (jointPoint) {
      return { x: jointPoint.x, y: jointPoint.y, obj: child };
    }
  }
  return null;
};

export const anySame = (objA, objB) => {
  for (const key in objA) if (key in objB) return true;
  // for (const key in objB) if (key in objA) return true;
  return false;
};

export const getFirstValue = (obj) => {
  for (const id in obj) return obj[id];
  return null;
};

export class EventManager {
  events = [];

  on(eventEmitter, eventName, cb) {
    const [on, off] =
      'on' in eventEmitter
        ? ['on', 'off']
        : 'addListener' in eventEmitter
        ? ['addListener', 'removeListener']
        : ['addEventListener', 'removeEventListener'];

    eventEmitter[on](eventName, cb);
    this.events.push({ off, eventName, eventEmitter, cb });

    return this;
  }

  off(eventEmitter, eventName, cb) {
    this.events = this.events.filter((e) => {
      if (cb) {
        if (
          cb !== e.cb ||
          eventName !== e.eventName ||
          eventEmitter !== e.eventEmitter
        )
          return true;
      } else if (eventName) {
        if (eventName !== e.eventName || eventEmitter !== e.eventEmitter)
          return true;
      } else if (eventEmitter) {
        if (eventEmitter !== e.eventEmitter) return true;
      }

      e.eventEmitter[e.off](e.eventName, e.cb);
      return false;
    });

    return this;
  }
}

/**
 * @param {Phaser.Scene} scene
 * @param {object[]} configs
 */
export const createUIButtons = (scene, configs, right = false) => {
  const padding = 10;
  const buttons = configs.map((c, i) => {
    const button = scene.add
      .dom(
        right ? scene.scale.width - padding : padding,
        10 + i * 50,
        'button',
        `background-color: ${colorIntToHex(
          c.bgColor || theme.white,
        )}; color: ${colorIntToHex(c.color || theme.black)}`,
        c.title,
      )
      .setData(c.data || {})
      .setClassName('ui-tool-button')
      .setOrigin(right ? 1 : 0, 0)
      .addListener('click');
    button.on('click', c.onClick);

    return button;
  });

  return buttons;
};
