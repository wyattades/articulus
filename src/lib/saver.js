import { debounce } from 'lodash';
import faunadb from 'faunadb';

import { Subject } from './async';
import { base48 } from './utils';
import { OBJECTS } from '../objects';
import { SHAPE_TYPE_CLASSES } from '../objects/Shape';
import { serializePhysics, deserializePhysics } from './physics';

export const fromJSON = (scene, json) => {
  if (json?.id == null) return null;

  const Klass = OBJECTS[json.type] || SHAPE_TYPE_CLASSES[json.type];
  if (!Klass) return null;

  const obj = Klass.fromJSON(scene, json);

  if (obj.x == null || Number.isNaN(obj.x)) return null;

  obj.id = json.id;
  obj.render();
  return obj;
};

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
 * @typedef { objs: { type: string }[], physics?: {} } MapData
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
  static loadPlayParts({ objs, physics }, group) {
    for (const sobj of objs) {
      const obj = fromJSON(group.scene, sobj);
      if (!obj) continue;

      obj.enablePhysics();
      group.add(obj);
    }

    if (physics) deserializePhysics(group.scene, physics);
  }

  /**
   * @param {MapData} mapData
   * @param {Phaser.GameObjects.Group} group
   */
  static loadEditorParts({ objs }, group) {
    for (const sobj of objs) {
      const obj = fromJSON(group.scene, sobj);
      if (!obj) continue;

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

    return {
      objs: data.objs,
      physics: data.physics,
    };
  }

  /**
   * @param {Phaser.GameObjects.Group} group
   */
  async save(group) {
    await MapSaver.init();

    const scene = group.scene;
    if (!scene) return;

    const objs = group.getChildren().map((obj) => {
      const json = obj.toJSON();
      json.id = obj.id;
      return json;
    });

    const physics = scene.ui ? serializePhysics(scene) : null;

    const data = {
      user_id: userId,
      name: this.name,
      objs,
      physics,
    };

    const res = await MapSaver.query(
      this.id
        ? q.Let(
            { data },
            q.If(
              q.Exists(q.Ref(q.Collection('maps'), this.id)),
              q.Update(q.Ref(q.Collection('maps'), this.id), {
                data: q.Var('data'),
              }),
              q.Create(q.Collection('maps'), {
                data: q.Var('data'),
              }),
            ),
          )
        : q.Create(q.Collection('maps'), {
            data,
          }),
    );

    this.id = res.ref.id;
  }

  queueSave = debounce(this.save.bind(this), 1000);
}

// // TEMP
// export const buildSaver = new (class BuildSaver {
//   static STORAGE_KEY = 'fc:latest-build';

//   data = this.load();

//   load() {
//     try {
//       const obj = JSON.parse(localStorage.getItem(BuildSaver.STORAGE_KEY));
//       if (obj && typeof obj === 'object') return obj;
//     } catch (_) {}
//     return {};
//   }

//   save() {
//     try {
//       localStorage.setItem(
//         BuildSaver.STORAGE_KEY,
//         JSON.stringify(this.settings),
//       );
//     } catch (_) {}
//   }

//   get() {
//     return this.data;
//   }

//   set(data) {
//     this.data = data;
//     this.save();
//   }
// })();

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
