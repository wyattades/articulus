import { debounce } from 'lodash';

import { Subject } from './async';
import { base48 } from './utils';
import { OBJECTS } from '../objects';
import { SHAPE_TYPE_CLASSES } from '../objects/Shape';
import { serializePhysics, deserializePhysics } from './physics';

/** @type {typeof import('faunadb').query} */
let q;

const addExtras = (q) => {
  q.FindOrCreate = (collection, id, data) => {
    if (id != null)
      return q.Let(
        { data },
        q.If(
          q.Exists(q.Ref(q.Collection(collection), id)),
          q.Update(q.Ref(q.Collection(collection), id), {
            data: q.Var('data'),
          }),
          q.Create(q.Collection(collection), { data: q.Var('data') }),
        ),
      );
    else return q.Create(q.Collection(collection), { data });
  };
};

const db = new (class DB {
  initter = null;

  async query(expr) {
    try {
      return this.client.query(expr);
    } catch (err) {
      console.error('failed query', err);
      throw err;
    }
  }

  async init() {
    if (this.initter) return this.initter.toPromise();
    this.initter = new Subject();

    this.fauna = await import('faunadb');

    q = this.fauna.query;
    addExtras(q);

    this.client = new this.fauna.Client({
      secret: process.env.FAUNA_CLIENT_KEY,
    });

    this.initter.complete();
  }
})();

export const fromJSON = (scene, json) => {
  if (json?.id == null) return null;

  const Klass = OBJECTS[json.type] || SHAPE_TYPE_CLASSES[json.type];
  if (!Klass) return null;

  const obj = Klass.fromJSON(scene, json);

  if (obj?.x == null || Number.isNaN(obj.x)) return null;

  obj.id = json.id;
  obj.render();
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
  static buildsMetaCache = {};

  static async loadBuildsMeta(limit = 21) {
    await db.init();

    const res = await db.query(
      q.Map(
        q.Paginate(q.Match(q.Index('builds_by_user_id'), userId), {
          size: limit,
        }),
        q.Lambda('ref', q.Get(q.Var('ref'))),
      ),
    );

    return res.data.map((l) => {
      const build = {
        id: l.ref.id,
        name: l.data.name,
        image: l.data.image,
      };

      MapSaver.buildsMetaCache[build.id] = build;

      return build;
    });
  }

  static loadPlayParts({ objs, physics }, group) {
    for (const sobj of objs) {
      const obj = fromJSON(group.scene, sobj);
      if (!obj) continue;

      obj.enablePhysics();
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
    await db.init();

    const scene = group.scene;
    if (!scene) return;

    if (scene.running) return;

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

    const res = await db.query(q.FindOrCreate('builds', this.id, data));

    this.id = res.ref.id;
  }

  queueSave = debounce(this.save.bind(this), 1000);
}

export class MapSaver {
  static mapsMetaCache = {};

  static async loadMapsMeta() {
    await db.init();

    const res = await db.query(
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

      MapSaver.mapsMetaCache[meta.id] = meta;

      return meta;
    });
  }

  id = null;
  name = null;

  constructor(id) {
    this.id = id;

    if (id) {
      const meta = MapSaver.mapsMetaCache[id];
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
      const obj = fromJSON(group.scene, sobj);
      if (!obj) continue;

      obj.enablePhysics();
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

    const { ref, data } = await db.query(
      q.Get(q.Ref(q.Collection('maps'), this.id)),
    );

    this.id = ref.id;
    this.name = data.name;

    return {
      objs: data.objs,
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
