import throttle from 'lodash/throttle';
import * as R from 'ramda';
import faunadb from 'faunadb';

import { SHAPE_TYPE_CLASSES } from '../objects/Shape';
import { Subject } from './async';
import { base48 } from './utils';

const q = faunadb.query;

// TEMP: until I build user system
const userId = (() => {
  let u = localStorage.getItem('fc:user_id');
  if (typeof u === 'string' && u.length >= 6) return u;

  u = base48(8);
  localStorage.setItem('fc:user_id', u);

  return u;
})();

/**
 * @typedef {{ x: number, y: number, width: number, height: number, type: string }[]} MapData
 */

/**
 * @typedef {{ name: string, _rev: string, _id: string }[]} MapMeta
 */

export class MapSaver {
  static metaCache = {};

  /**
   * @type {faunadb.Client}
   */
  static db = null;

  static initter = null;

  static async query(expr) {
    try {
      return MapSaver.db.query(expr);
    } catch (err) {
      console.error('fauna error', err);
      throw err;
    }
  }

  static async init() {
    if (MapSaver.initter) return MapSaver.initter.toPromise();
    MapSaver.initter = new Subject();

    MapSaver.db = new faunadb.Client({
      secret: process.env.FAUNA_CLIENT_KEY,
    });

    MapSaver.initter.complete();
  }

  objs = null;
  id = null;
  rev = null;
  name = null;

  static async loadLevelsMeta() {
    await MapSaver.init();

    const res = await MapSaver.query(
      q.Map(
        q.Paginate(q.Match(q.Index('maps_by_user_id'), userId), { size: 21 }),
        q.Lambda('ref', q.Get(q.Var('ref'))),
      ),
    );

    return res.data.map((l) => {
      const meta = {
        id: l.ref.id,
        name: l.data.name,
      };

      MapSaver.metaCache[meta.id] = meta;

      return meta;
    });
  }

  constructor(id) {
    this.id = id;

    if (id) {
      const meta = MapSaver.metaCache[id];
      if (meta) {
        this.name = meta.name;
      }
    }
  }

  setName(name) {
    this.name = name;
  }

  /**
   * @param {MapData} mapData
   * @param {Phaser.GameObjects.Group} group
   */
  static loadPlayParts(mapData, group) {
    for (const sobj of mapData) {
      const ShapeClass = SHAPE_TYPE_CLASSES[sobj.type];
      if (!ShapeClass) continue;

      const obj = new ShapeClass(group.scene, sobj.x, sobj.y);
      obj.setSize(sobj.width, sobj.height);
      obj.render();
      obj.enablePhysics();

      group.add(obj);
    }
  }

  /**
   * @param {MapData} mapData
   * @param {Phaser.GameObjects.Group} group
   */
  static loadEditorParts(mapData, group) {
    for (const sobj of mapData) {
      const ShapeClass = SHAPE_TYPE_CLASSES[sobj.type];
      if (!ShapeClass) continue;

      const obj = new ShapeClass(group.scene, sobj.x, sobj.y);
      obj.setSize(sobj.width, sobj.height);
      obj.render();

      group.add(obj);
    }
  }

  async load() {
    await MapSaver.init();

    const { ref, data } = await MapSaver.query(
      q.Get(q.Ref(q.Collection('maps'), this.id)),
    );

    this.id = ref.id;
    this.name = data.name;

    this.objs = data.objs;

    return data.objs;
  }

  /**
   * @param {Phaser.GameObjects.Group} group
   */
  async save(group) {
    await MapSaver.init();

    // TODO: obj.toJSON ?
    const serialized = R.map(
      R.pick(['x', 'y', 'width', 'height', 'type']),
      group.getChildren(),
    );

    const data = {
      user_id: userId,
      name: this.name,
      objs: serialized,
    };

    const res = await MapSaver.query(
      this.id
        ? // TODO: test if ref exists first?
          q.Update(q.Ref(q.Collection('maps'), this.id), { data })
        : q.Create(q.Collection('maps'), {
            data,
          }),
    );

    this.id = res.ref.id;
  }

  queueSave = throttle(this.save.bind(this), 400);
}

export const settingsSaver = new (class SettingsSaver {
  static STORAGE_KEY = 'fc:settings';

  settings = this.load();

  load() {
    try {
      const obj = JSON.parse(localStorage.getItem(SettingsSaver.STORAGE_KEY));
      if (obj && typeof obj === 'object') return obj;
    } catch (_) {}
    return {};
  }

  save() {
    try {
      localStorage.setItem(
        SettingsSaver.STORAGE_KEY,
        JSON.stringify(this.settings),
      );
    } catch (_) {}
  }

  get(key) {
    return this.settings[key];
  }

  set(key, value) {
    this.settings[key] = value;
    this.save();
  }
})();
