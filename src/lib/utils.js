import Phaser from 'phaser';
import _ from 'lodash';

import * as MoreIntersects from 'lib/intersects';
import theme from 'src/styles/theme';

/**
 * @param {Number} num
 */
export const colorIntToHex = (num) =>
  `#${`00000${num.toString(16)}`.substr(-6)}`;

export const colorInverse = (num) => {
  const { red, green, blue } = Phaser.Display.Color.IntegerToColor(num);
  return red * 0.299 + green * 0.587 + blue * 0.114 > 186 ? 0x000000 : 0xffffff;
};

export const isNum = (x) => typeof x === 'number' && !Number.isNaN(x);

export const validPoint = (p) => {
  try {
    return p != null && isNum(p.x) && isNum(p.y);
  } catch {
    return false;
  }
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
export const setNextId = (val) => {
  if (val > _id) _id = val;
};

const charSample = [
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
];
export const base48 = (size = 8) =>
  [...new Array(size)]
    .map(() => charSample[Math.floor(Math.random() * charSample.length)])
    .join('');

export function* circle4Points(radius, startRotation = 0) {
  const cos = Math.cos(startRotation) * radius;
  const sin = Math.sin(startRotation) * radius;

  yield [cos, sin];
  yield [sin, -cos];
  yield [-cos, -sin];
  yield [-sin, cos];
}

const INTERSECT_MATRIX = (() => {
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
  const TYPES = [
    'Circle',
    'Ellipse',
    'Line',
    'Point',
    'Polygon',
    'Rectangle',
  ].reduce((arr, name) => {
    arr[new Phaser.Geom[name]().type] = name;
    return arr;
  }, []);

  return TYPES.map((a) => TYPES.map((b) => Intersects[`${a}To${b}`]));
})();

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

  const parts = _.difference(scene.parts.getChildren(), ignore);

  const geom = obj.geom;
  for (const part of parts)
    if (!part.noCollide && intersectsGeoms(geom, part.geom)) return part;
  return null;
};

export const getTopObject = (scene, x, y) => {
  const point = new Phaser.Geom.Point(x, y);

  const children = scene.parts.getChildren();
  for (let i = children.length - 1; i >= 0; i--) {
    const obj = children[i];

    if (intersectsGeoms(point, obj.geom)) return obj;
  }

  return null;
};

export const anySame = (objA, objB) => {
  for (const key in objA) if (key in objB) return true;
  // for (const key in objB) if (key in objA) return true;
  return false;
};

/**
 * @template T
 * @param {Record<string, T>} obj
 * @yields {T}
 */
export function* valuesIterator(obj) {
  for (const k in obj) yield obj[k];
}

export const getFirstValue = (obj) => {
  for (const id in obj) return obj[id];
  return null;
};

export const getFirstSameKeyValue = (a, b) => {
  for (const k in a) if (k in b) return a[k];

  for (const k in b) if (k in a) return a[k];

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

export const createUIButton = (scene, x, y, c) => {
  const button = scene.add
    .dom(
      x,
      y,
      'button',
      `background-color: ${colorIntToHex(
        c.bgColor ?? theme.white,
      )}; color: ${colorIntToHex(c.color ?? theme.black)}`,
      c.title,
    )
    .setData(c.data || {})
    .setClassName('ui-tool-button')
    .addListener('click');
  button.on('click', c.onClick);
  return button;
};

/**
 * @param {Phaser.Scene} scene
 * @param {object[]} configs
 */
export const createUIButtons = (scene, configs, xRatio = 0, yRatio = 0) => {
  const padding = 10;
  const bHeight = 50;
  const buttons = configs.map((c, i) =>
    createUIButton(
      scene,
      xRatio === 1 ? scene.scale.width - padding : padding,
      yRatio === 1
        ? scene.scale.height - padding - i * bHeight
        : padding + i * bHeight,
      c,
    ).setOrigin(xRatio, yRatio),
  );

  return buttons;
};

export const getObjectsBounds = (objs) => {
  const o = objs[0];
  if (!o) return null;

  const bounds = new Phaser.Geom.Rectangle(o.x, o.y, 0, 0);

  for (const { geom } of objs) {
    if (geom.right > bounds.right) bounds.right = geom.right;
    if (geom.bottom > bounds.bottom) bounds.bottom = geom.bottom;
    if (geom.left < bounds.left) bounds.left = geom.left;
    if (geom.top < bounds.top) bounds.top = geom.top;
  }

  return bounds;
};

export const fitCameraToObjs = (camera, objs) => {
  if (objs.length === 0) return;

  const bounds = getObjectsBounds(objs);
  if (!bounds) return;

  camera.setScroll(
    bounds.centerX - camera.width / 2,
    bounds.centerY - camera.height / 2,
  );
  camera.setZoom(camera.width / bounds.width);
};
