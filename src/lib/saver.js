import { debounce } from 'lodash';
import { createClient } from '@supabase/supabase-js';

import { validPoint } from 'lib/utils';
import { OBJECTS } from 'src/objects';
import { SHAPE_TYPE_CLASSES } from 'src/objects/Shape';
import { serializePhysics, deserializePhysics } from 'lib/physics';

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

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

const findOrCreateBy = async (table, data) => {
  const res = await db.from(table).select('id').match(data).limit(1);
  if (res.data[0]?.id) return res.data[0];

  const res2 = await db.from(table).insert(data);

  return res2.data[0];
};

let userIdPromise;
const getUserId = async () => {
  let u = localStorage.getItem('articulus:user_id');
  if (typeof u === 'string' && u.length >= 6) return u;

  let user = null;
  while (!user) {
    const username = window.prompt('Enter a username to continue');

    if (username) user = await findOrCreateBy('users', { username });
  }

  localStorage.setItem('articulus:user_id', user.id);

  return user.id;
};

/**
 * @typedef { objs: { type: string }[], physics?: {} } MapData
 */

/**
 * @typedef {{ name: string, _rev: string, _id: string }[]} MapMeta
 */

export class BuildSaver {
  static buildsMetaCache = {};

  static async loadBuildsMeta(from = 0, to = 21) {
    const userId = await (userIdPromise ||= getUserId());

    const res = await db
      .from('builds')
      .select('id, name')
      .match({ user_id: userId })
      .range(from, to);

    return res.data.map((l) => {
      const build = {
        id: l.id,
        name: l.name,
        // image: l.data.image,
      };

      MapSaver.buildsMetaCache[build.id] = build;

      return build;
    });
  }

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
    if (!this.id) return null;

    let query = db.from('builds').select().limit(1);

    if (this.id) query = query.match({ id: this.id });

    const build = (await query).data[0];

    if (!build) return null;

    this.id = build.id;
    // this.name = build.name;

    return {
      objs: build.objects,
      physics: build.physics,
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

    const userId = await (userIdPromise ||= getUserId());

    const data = {
      user_id: userId,
      // name: this.name,
      data: {
        objects: objs,
        physics,
      },
    };

    if (this.id) {
      await db
        .from('builds')
        .update(data, { returning: 'minimal' })
        .match({ id: this.id });
    } else {
      const res = await db.from('builds').insert(data);

      this.id = res.data[0].id;
    }
  }

  queueSave = debounce(this.save.bind(this), 1000);
}

export class MapSaver {
  static mapsMetaCache = {};

  static async loadMapsMeta(from = 0, to = 21) {
    const userId = await (userIdPromise ||= getUserId());

    const res = await db
      .from('maps')
      .select('id, name')
      .match({ user_id: userId })
      .range(from, to);

    return res.data.map((l) => {
      const meta = {
        id: l.id,
        name: l.name,
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
    if (!this.id) return null;

    const { data: map } = await db
      .from('maps')
      .select()
      .match({ id: this.id })
      .single();

    this.id = map.id;
    this.name = map.name;

    return {
      objs: map.data.objects,
    };
  }

  /**
   * @param {Phaser.GameObjects.Group} group
   */
  async save(group) {
    const scene = group.scene;
    if (!scene) return;

    const objs = group.getChildren().map((obj) => {
      const json = obj.toJSON();
      json.id = obj.id;
      return json;
    });

    const userId = await getUserId();

    const data = {
      user_id: userId,
      name: this.name,
      data: { objects: objs },
    };

    if (this.id) {
      await db
        .from('maps')
        .update(data, { returning: 'minimal' })
        .match({ id: this.id });
    } else {
      const res = await db.from('maps').insert(data);

      this.id = res.data[0].id;
    }
  }

  queueSave = debounce(this.save.bind(this), 1000);
}

export const settingsSaver = new (class SettingsSaver {
  static STORAGE_KEY = 'articulus:settings';

  settings = this.load();

  load() {
    try {
      const obj = JSON.parse(localStorage.getItem(SettingsSaver.STORAGE_KEY));
      if (obj && typeof obj === 'object') return obj;
    } catch {}
    return {};
  }

  save() {
    try {
      localStorage.setItem(
        SettingsSaver.STORAGE_KEY,
        JSON.stringify(this.settings),
      );
    } catch {}
  }

  get(key) {
    return this.settings[key];
  }

  set(key, value) {
    this.settings[key] = value;
    this.save();
  }
})();
