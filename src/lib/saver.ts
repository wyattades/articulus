import * as _ from 'lodash-es';
import Phaser from 'phaser';
import Router from 'next/router';
import type { GameBuild, GameMap } from '@prisma/client';
import { getSession } from 'next-auth/react';
import type { inferAsyncReturnType } from '@trpc/server';
import { TRPCClientError } from '@trpc/client';

import { validPoint } from 'lib/utils';
import { OBJECT_TYPE_MAP, ObjectInstance } from 'src/objects';
import {
  serializePhysics,
  deserializePhysics,
  SerialPhysics,
} from 'lib/physics';
import type PlayScene from 'src/scenes/Play';
import type EditorScene from 'src/scenes/Editor';
import type { BaseScene } from 'src/scenes/Scene';
import type { AuthSession } from 'pages/api/auth/[...nextauth]';
import { trpc } from 'lib/trpc';

type GameObjJson = {
  id: number;
} & ReturnType<ObjectInstance['toJSON']>;

export type GameBuildData = {
  objects: GameObjJson[];
  physics?: SerialPhysics;
};

export type GameMapData = {
  objects: GameObjJson[];
  physics?: SerialPhysics;
};

type GameMapMeta = inferAsyncReturnType<
  typeof trpc.gameMaps.allMetas.query
>[number];

type GameBuildMeta = inferAsyncReturnType<
  typeof trpc.gameBuilds.allMetas.query
>[number];

export const fromJSON = (
  scene: BaseScene,
  json: GameObjJson,
  enablePhysics = false,
): Phaser.GameObjects.Sprite | null => {
  if (json?.id == null) return null;

  const Klass = OBJECT_TYPE_MAP[json.type];
  if (!Klass) return null;

  // TODO: fix types
  const obj = Klass.fromJSON(scene, json as any) as ObjectInstance;

  // NOTE: this ignores `Line`
  if ('x' in obj && 'y' in obj && !validPoint(obj)) return null;

  obj.id = json.id;

  if (enablePhysics) obj.enablePhysics();
  obj.saveRender(); // must be after enablePhysics

  return obj as any;
};

const getUserId = async () => {
  const session = (await getSession()) as AuthSession | null;

  return session?.user?.id || null;
};

// TODO: use next-auth
// let userIdPromise;
// const getUserId = async (): Promise<User['id']> => {
//   const uid = localStorage.getItem('articulus:user_id');
//   if (typeof uid === 'string' && uid.length >= 6) return uid;

//   let user = null;
//   while (!user) {
//     await new Promise((r) => setTimeout(r, 100));

//     const username = window.prompt('Enter a username to continue');

//     if (username) {
//       // user = await findOrCreateBy('users', { username });

//       user = await prisma.user.findFirst({
//         where: {
//           username,
//         },
//       });
//       if (!user) {
//         user = await prisma.user.create({
//           data: {
//             username,
//           },
//         });
//       }
//     }
//   }

//   localStorage.setItem('articulus:user_id', user.id);

//   return user.id;
// };

/**
 * Objects within the scene's `worldBounds` and some reasonable padding
 */
const withinBounds = <Obj extends Phaser.GameObjects.Sprite | ObjectInstance>(
  objects: Obj[],
  bounds: Phaser.Geom.Rectangle | undefined,
  padding = 3000,
): Obj[] => {
  if (!bounds) return [];

  const sanityBounds = new Phaser.Geom.Rectangle(
    bounds.x - padding,
    bounds.y - padding,
    bounds.width + 2 * padding,
    bounds.height + 2 * padding,
  );

  const objBounds = new Phaser.Geom.Rectangle();
  return objects.filter((obj) => {
    obj.getBounds(objBounds);
    return (
      sanityBounds.contains(objBounds.left, objBounds.top) &&
      sanityBounds.contains(objBounds.right, objBounds.bottom)
    );
  });
};

export class BuildSaver {
  static buildsMetaCache: {
    [id in GameBuildMeta['id']]?: GameBuildMeta;
  } = {};

  static async loadBuildsMeta(_from = 0, _to = 21) {
    const gameBuilds = await trpc.gameBuilds.allMetas.query();

    for (const build of gameBuilds) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      BuildSaver.buildsMetaCache[build.id] = build;
    }

    return gameBuilds;
  }

  static loadPlayParts(
    { objects, physics }: GameBuildData,
    group: Phaser.GameObjects.Group,
  ) {
    for (const sobj of objects) {
      const obj = fromJSON(group.scene as BaseScene, sobj, true);
      if (!obj) continue;

      group.add(obj);
    }

    if (physics) deserializePhysics(group.scene, physics);
  }

  id: GameBuild['id'] | null = null;

  async load() {
    if (!this.id) return new Error('No gameBuild id');

    const gameBuild = await trpc.gameBuilds.get.query({
      id: this.id,
    });
    // this.meta = gameBuild;

    return {
      objects: gameBuild.data.objects,
      physics: gameBuild.data.physics,
    };
  }

  async save(group: Phaser.GameObjects.Group) {
    this.queueSave.cancel();

    const scene = group.scene as PlayScene | EditorScene;
    if (!scene || scene.running) return;

    const objects = withinBounds(
      group.getChildren() as unknown as ObjectInstance[],
      scene.worldBounds,
    ).map((obj) => {
      const json = obj.toJSON() as GameObjJson;
      json.id = obj.id;
      return json;
    });

    const physics = serializePhysics(scene);

    // TODO: save locally?
    if (!(await getUserId())) return;

    await trpc.gameBuilds.update.mutate({
      id: this.id,
      //  name: this.name,
      data: {
        objects,
        physics,
      },
    });
  }

  queueSave = _.debounce(this.save.bind(this), 3000);
}

export class MapSaver {
  static mapsMetaCache: {
    [id in GameMapMeta['id']]?: GameMapMeta;
  } = {};

  static async loadMapsMeta() {
    const metas = await trpc.gameMaps.allMetas.query();

    for (const meta of metas) {
      MapSaver.mapsMetaCache[meta.id] = meta;
    }

    return metas;
  }

  id: GameMap['id'] | null = null;
  slug: GameMap['slug'] | null = null;
  meta: GameMapMeta | null = null;

  constructor({
    id,
    slug,
  }: { id?: GameMap['id'] | null; slug?: GameMap['slug'] | null } = {}) {
    this.id = id ?? null;

    if (id) {
      this.meta = MapSaver.mapsMetaCache[id] ?? null;
    } else if (slug) {
      // TODO: optimize
      this.meta =
        Object.values(MapSaver.mapsMetaCache).find(
          (m) => m && m.slug === slug,
        ) ?? null;
    }

    this.slug = slug ?? this.meta?.slug ?? null;
  }

  async update(updates: { name?: string; isPublic?: boolean }) {
    if (!this.id) throw new Error('No gameMap id');

    await trpc.gameMaps.update.mutate({
      id: this.id,
      ...updates,
    });
  }

  saveName?: string;
  async setName(name: string, save = true) {
    if (save) await this.update({ name });
    else this.saveName = name;
  }

  async setPublic(isPublic: boolean) {
    // this.isPublic = isPublic;

    await this.update({ isPublic });
  }

  async delete() {
    if (!this.id) throw new Error('No gameMap id');

    await trpc.gameMaps.delete.mutate({
      id: this.id,
    });

    this.id = null;
    this.meta = null;
  }

  static loadPlayParts(
    { objects }: GameMapData,
    group: Phaser.GameObjects.Group,
  ) {
    for (const sobj of objects) {
      const obj = fromJSON(group.scene as BaseScene, sobj, true);
      if (!obj) continue;

      group.add(obj);
    }
  }

  static loadEditorParts(
    { objects }: GameMapData,
    group: Phaser.GameObjects.Group,
  ) {
    for (const sobj of objects) {
      const obj = fromJSON(group.scene as BaseScene, sobj);
      if (!obj) continue;

      group.add(obj);
    }
  }

  async load() {
    if (!this.id && !this.slug) throw new Error('No gameMap id');

    try {
      const map = await trpc.gameMaps.get.query({
        id: this.id ?? undefined,
        slug: this.slug ?? undefined,
      });

      this.id = map.id;
      this.meta = _.omit(map, 'data');

      return {
        objects: map.data.objects,
      };
    } catch (err) {
      if (err instanceof TRPCClientError && err.data?.code === 'NOT_FOUND') {
        window.alert('Oops! Map not found!');
        Router.push('/');
        return { objects: [] };
      }
      throw err;
    }
  }

  async save(group: Phaser.GameObjects.Group) {
    const scene = group.scene as PlayScene | EditorScene;
    if (!scene) return;

    const objects = withinBounds(
      group.getChildren() as unknown as ObjectInstance[],
      scene.worldBounds,
    ).map((obj) => {
      const json = obj.toJSON() as GameObjJson;
      json.id = obj.id;
      return json;
    });

    const userId = await getUserId();

    if (!userId) {
      localStorage.setItem(
        'articulus:unauthed-map',
        JSON.stringify({ objects }),
      );
      return;
    }

    const isFork = this.id && this.meta?.user && this.meta.user.id !== userId;

    let name = this.saveName || this.meta?.name || 'Untitled';
    this.saveName = undefined;
    if (isFork) {
      name = `${name} (Forked)`;
      this.id = null;
      this.meta = null;
    }

    const map = await trpc.gameMaps.update.mutate({
      id: this.id, // if null, it will create a new one
      name,
      data: { objects },
    });

    this.id = map.id;
    this.meta = map;

    // TODO: put this somewhere else?
    const currentSlug = Router.pathname.match(/\/edit\/([^/]+)/)?.[1];
    if (currentSlug !== map.slug) {
      Router.replace(`/edit/${map.slug}`);
    }
  }

  queueSave = _.debounce(this.save.bind(this), 3000);
}

export const settingsSaver = new (class SettingsSaver {
  static STORAGE_KEY = 'articulus:settings';

  settings = this.load();

  load() {
    try {
      const str = localStorage.getItem(SettingsSaver.STORAGE_KEY);
      const obj = str && JSON.parse(str);
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

  get(key: string) {
    return this.settings[key];
  }

  set(key: string, value: any) {
    this.settings[key] = value;
    this.save();
  }
})();
