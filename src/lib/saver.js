import * as _ from 'lodash-es';
import { createClient } from '@supabase/supabase-js';
import Phaser from 'phaser';
import Router from 'next/router';

import { validPoint } from 'lib/utils';
import { OBJECT_TYPE_MAP, Part } from 'src/objects';
import { serializePhysics, deserializePhysics } from 'lib/physics';

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export const fromJSON = (scene, json, enablePhysics = false) => {
  if (json?.id == null) return null;

  const Klass = OBJECT_TYPE_MAP[json.type];
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
  const uid = localStorage.getItem('articulus:user_id');
  if (typeof uid === 'string' && uid.length >= 6) return uid;

  let user = null;
  while (!user) {
    await new Promise((r) => setTimeout(r, 100));

    const username = window.prompt('Enter a username to continue');

    if (username) user = await findOrCreateBy('users', { username });
  }

  localStorage.setItem('articulus:user_id', user.id);

  return user.id;
};

/**
 * Objects within the scene's `worldBounds` and some reasonable padding
 * @param {Part[]} objs
 * @param {Phaser.Geom.Rectangle} bounds
 */
const withinBounds = (objs, bounds, padding = 3000) => {
  const sanityBounds = new Phaser.Geom.Rectangle(
    bounds.x - padding,
    bounds.y - padding,
    bounds.width + 2 * padding,
    bounds.height + 2 * padding,
  );

  const objBounds = new Phaser.Geom.Rectangle();
  return objs.filter((obj) => {
    obj.getBounds(objBounds);
    return (
      sanityBounds.contains(objBounds.left, objBounds.top) &&
      sanityBounds.contains(objBounds.right, objBounds.bottom)
    );
  });
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

      // eslint-disable-next-line @typescript-eslint/no-use-before-define
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

    const userId = await (userIdPromise ||= getUserId());

    const { data: build } = await db
      .from('builds')
      .select()
      .match({ user_id: userId, id: this.id })
      .single();

    if (!build) return null;

    // this.id = build.id;
    // this.name = build.name;

    return {
      objs: build.data.objects,
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

    const objs = withinBounds(group.getChildren(), group.scene.worldBounds).map(
      (obj) => {
        const json = obj.toJSON();
        json.id = obj.id;
        return json;
      },
    );

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
      const res = await db.from('builds').insert(data).select('id');

      this.id = res.data[0].id;
    }
  }

  queueSave = _.debounce(this.save.bind(this), 3000);
}

export class MapSaver {
  static mapsMetaCache = {};

  static async loadMapsMeta() {
    const userId = await (userIdPromise ||= getUserId());

    const { data: myLevels } = await db
      .from('maps')
      .select('id, name, user_id, is_public')
      .order('created_at', { ascending: false })
      .match({ user_id: userId });

    const { data: publicLevels } = await db
      .from('maps')
      .select('id, name, user_id, is_public, users(username)')
      .order('updated_at', { ascending: false })
      .neq('user_id', userId)
      .match({ is_public: true });

    return [...myLevels, ...publicLevels].map((l) => {
      const meta = {
        id: l.id,
        name: l.name,
        is_public: l.is_public,
        mine: l.user_id === userId,
        author: l.users?.username || null,
      };

      MapSaver.mapsMetaCache[meta.id] = meta;

      return meta;
    });
  }

  /** @type {string | null} */
  id = null;
  /** @type {string | null} */
  name = null;
  /** @type {boolean | null} */
  is_public = null;

  constructor(id) {
    this.id = id;

    if (id) {
      const meta = MapSaver.mapsMetaCache[id];
      if (meta) {
        this.name = meta.name;
        this.user_id = meta.user_id;
        this.is_public = meta.is_public;
      }
    }
  }

  async update(updates) {
    if (!this.id) return;

    await db
      .from('maps')
      .update(updates, { returning: 'minimal' })
      .match({ id: this.id });
  }

  async setName(name, save = true) {
    this.name = name;

    if (save) await this.update({ name });
  }

  async setPublic(is_public) {
    this.is_public = is_public;

    await this.update({ is_public });
  }

  async delete() {
    if (!this.id) return;

    await db
      .from('maps')
      .delete({ returning: 'minimal' })
      .match({ id: this.id });

    this.id = null;
    this.name = null;
    this.user_id = null;
    this.is_public = null;
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
    this.user_id = map.user_id;
    this.is_public = map.is_public;

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

    const objs = withinBounds(group.getChildren(), group.scene.worldBounds).map(
      (obj) => {
        const json = obj.toJSON();
        json.id = obj.id;
        return json;
      },
    );

    const userId = await getUserId();

    const isFork = this.id && this.user_id && this.user_id !== userId;

    if (isFork) {
      this.name = `${this.name || '???'} (Forked)`;
      this.user_id = userId;
      this.id = null;
    }

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
      const res = await db.from('maps').insert(data).select('id');

      this.id = res.data[0].id;

      // TODO: put this somewhere else
      if (Router.pathname.match(/\/edit\/([^/]+)/)?.[1] !== this.id) {
        Router.replace(`/edit/${this.id}`);
      }
    }
  }

  queueSave = _.debounce(this.save.bind(this), 3000);
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
