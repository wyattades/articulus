import { debounce } from 'lodash';

import { base48, validPoint } from './utils';
import { OBJECTS } from '../objects';
import { SHAPE_TYPE_CLASSES } from '../objects/Shape';
import { serializePhysics, deserializePhysics } from './physics';
import DB from './db';
import { OfflineCache } from './cache';

const db = DB.getGlobalInstance();
let q;
db.onLoadQ((_q) => {
  q = _q;
});

export const fromJSON = (scene, json, enablePhysics = false) => {
  if (json?.id == null) return null;

  const Klass = OBJECTS[json.type] || SHAPE_TYPE_CLASSES[json.type];
  if (!Klass) return null;

  const obj = Klass.fromJSON(scene, json);

  if (!validPoint(obj)) return null;

  obj.id = json.id;

  if (enablePhysics) obj.enablePhysics();
  obj.saveRender(); // must be after enablePhysics

  return obj;
};

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

export class BuildSaver {
  static cache = new OfflineCache('builds');

  // static async loadBuildsMeta(limit = 21) {
  //   await db.init();

  //   const res = await BuildSaver.cache.fetch(
  //     userId,
  //     () =>
  //       db.query(
  //         q.Map(
  //           q.Paginate(q.Match(q.Index('builds_by_user_id'), userId), {
  //             size: limit,
  //           }),
  //           q.Lambda('ref', q.Get(q.Var('ref'))),
  //         ),
  //       ),
  //     () => [],
  //   );

  //   const builds = res.data.map((l) => ({
  //     id: l.ref.id,
  //     name: l.data.name,
  //     image: l.data.image,
  //   }));

  //   return builds;
  // }

  static loadPlayParts({ objs, physics }, group) {
    for (const sobj of objs) {
      const obj = fromJSON(group.scene, sobj, true);
      if (!obj) continue;

      group.add(obj);
    }

    if (physics) deserializePhysics(group.scene, physics);
  }

  id = null;

  async load() {
    await db.init();

    let build;
    if (this.id) {
      build = await db.query(q.Get(q.Ref(q.Collection('maps'), this.id)));
    } else {
      const res = await db.query(
        q.Map(
          q.Paginate(q.Match(q.Index('builds_by_user_id'), userId), {
            size: 1,
          }),
          q.Lambda('ref', q.Get(q.Var('ref'))),
        ),
      );
      build = res.data[0];
    }

    if (!build) return null;

    this.id = build.ref.id;
    // this.name = build.data.name;

    return {
      objs: build.data.objs,
      physics: build.data.physics,
    };
  }

  /**
   * @param {Phaser.GameObjects.Group} group
   */
  async save(group) {
    this.queueSave.cancel();

    const scene = group.scene;
    if (!scene || scene.running) return;

    const objs = group.getChildren().map((obj) => {
      const json = obj.toJSON();
      json.id = obj.id;
      return json;
    });

    const physics = serializePhysics(scene);

    const data = {
      user_id: userId,
      objs,
      physics,
    };

    await db.init();
    const res = await db.query(q.FindOrCreate('builds', this.id, data));

    this.id = res.ref.id;
  }

  queueSave = debounce(this.save.bind(this), 1000);
}

export class MapSaver {
  static cache = new OfflineCache();

  static async loadMapsMeta() {

    await db.init();


    const res = await db.tryQuery(q.Map(
        q.Paginate(q.Match(q.Index('maps_by_user_id'), userId), { size: 21 }),
        q.Lambda('ref', q.Get(q.Var('ref'))),
      ),
    );

    if (!res) return MapSaver.cache.get(res.)

    return res.data.map((l) => {
      const meta = {
        id: l.ref.id,
        name: l.data.name,
      };

      MapSaver.cache.set(l.ref.id, meta);

      return meta;
    });
  }

  id = null;
  name = null;

  constructor(id) {
    this.id = id;

    if (id) {
      const meta = MapSaver.cache.get(id);
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
  static loadPlayParts({ objs }, group) {
    for (const sobj of objs) {
      const obj = fromJSON(group.scene, sobj, true);
      if (!obj) continue;

      group.add(obj);
    }
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
    await db.init();

    const {
      ref,
      data: { name, objs },
    } = await db.query(q.Get(q.Ref(q.Collection('maps'), this.id)));

    MapSaver.cache.set(ref.id, { name, objs }).mapsCache[ref.id];

    ref;
    this.id = ref.id;
    this.name = name;

    return {
      objs,
    };
  }

  /**
   * @param {Phaser.GameObjects.Group} group
   */
  async save(group) {
    await db.init();

    const scene = group.scene;
    if (!scene) return;

    const objs = group.getChildren().map((obj) => {
      const json = obj.toJSON();
      json.id = obj.id;
      return json;
    });

    const data = {
      user_id: userId,
      name: this.name,
      objs,
    };

    const res = await db.query(q.FindOrCreate('maps', this.id, data));

    this.id = res.ref.id;
  }

  queueSave = debounce(this.save.bind(this), 1000);
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
