import type { GameBuild, GameMap } from '@prisma/client';
import { TRPCClientError } from '@trpc/client';
import type { inferAsyncReturnType } from '@trpc/server';
import * as _ from 'lodash-es';
import Router from 'next/router';
import Phaser from 'phaser';

import type { SerialPhysics } from 'lib/physics';
import { deserializePhysics, serializePhysics } from 'lib/physics';
import type { Terrain } from 'lib/terrain';
import { trpc } from 'lib/trpc';
import { validPoint } from 'lib/utils';
import { LocalDataSaver } from 'lib/utils/localDataSaver';
import type { AuthSession } from 'server/auth';
import type { ObjectInstance, Part } from 'src/objects';
import { OBJECT_TYPE_MAP } from 'src/objects';
import type { AnyScene } from 'src/scenes';
import type EditorScene from 'src/scenes/Editor';
import type PlayScene from 'src/scenes/Play';
import type { BaseScene, ObjectsGroup } from 'src/scenes/Scene';

type GameObjJson = {
  id: number;
} & ReturnType<ObjectInstance['toSaveJSON']>;

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

export const settingsSaver = new LocalDataSaver<{
  snapping?: boolean;
  debug?: boolean;
}>('articulus:settings');

const unsavedMapStorage = new LocalDataSaver<GameMapData>(
  'articulus:unauthed-map',
);

export const UNSAVED_MAP_SLUG = '__unsaved__';

export const fromJSON = <T extends Part | Terrain>(
  scene: BaseScene,
  json: GameObjJson,
  enablePhysics = false,
): T | null => {
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

  return obj as unknown as T;
};

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
      BuildSaver.buildsMetaCache[build.id] = build;
    }

    return gameBuilds;
  }

  static loadPlayParts(
    { objects, physics }: GameBuildData,
    group: ObjectsGroup<Part>,
  ) {
    for (const sobj of objects) {
      const obj = fromJSON(group.scene as BaseScene, sobj, true);
      if (!obj) continue;

      group.add(obj as unknown as Part);
    }

    if (physics) deserializePhysics(group.scene as BaseScene, physics);
  }

  id: GameBuild['id'] | null = null;

  async load() {
    if (!this.id) throw new Error('No gameBuild id');

    const gameBuild = await trpc.gameBuilds.get.query({
      id: this.id,
    });
    // this.meta = gameBuild;

    return {
      objects: gameBuild.data.objects,
      physics: gameBuild.data.physics,
    } as GameBuildData;
  }

  async save(group: ObjectsGroup<Part>) {
    this.queueSave.cancel();

    const scene = group.scene as PlayScene | EditorScene;
    if (!scene || scene.running) return;

    const authUser = scene.game.authUser;
    if (!authUser) return; // TODO: show error message?

    const objects = withinBounds(
      group.getChildren() as unknown as ObjectInstance[],
      scene.worldBounds,
    ).map((obj) => {
      const json = obj.toSaveJSON() as GameObjJson;
      json.id = obj.id;
      return json;
    });

    const physics = serializePhysics(scene);

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

  static loadPlayParts<T extends Part | Terrain>(
    { objects }: GameMapData,
    group: ObjectsGroup<T>,
  ) {
    for (const sobj of objects) {
      const obj = fromJSON<T>(group.scene as BaseScene, sobj, true);
      if (!obj) continue;

      group.add(obj);
    }
  }

  static loadEditorParts<T extends Part | Terrain>(
    { objects }: GameMapData,
    group: ObjectsGroup<T>,
  ) {
    for (const sobj of objects) {
      const obj = fromJSON<T>(group.scene as BaseScene, sobj);
      if (!obj) continue;

      group.add(obj);
    }
  }

  async load(): Promise<GameMapData> {
    if ((!this.id && !this.slug) || this.slug === UNSAVED_MAP_SLUG) {
      const objects = unsavedMapStorage.get('objects');
      return {
        objects: objects ?? [],
      } as GameMapData;
    }

    try {
      const map = await trpc.gameMaps.get.query(
        this.id
          ? { id: this.id }
          : this.slug
            ? { slug: this.slug }
            : (() => {
                throw new Error('No gameMap id');
              })(),
      );

      this.id = map.id;
      this.meta = _.omit(map, 'data');

      return {
        objects: map.data.objects,
      } as GameMapData;
    } catch (err) {
      if (
        err instanceof TRPCClientError &&
        (err.data as { code?: string } | undefined)?.code === 'NOT_FOUND'
      ) {
        // eslint-disable-next-line no-alert
        window.alert('Oops! Map not found!');
        void Router.push('/');
        return { objects: [] };
      }
      throw err;
    }
  }

  async save(group: ObjectsGroup<Part>) {
    const scene = group.scene as AnyScene;
    if (!scene) return;

    const authUser = scene.game.authUser;

    const objects = withinBounds(
      group.getChildren() as unknown as ObjectInstance[],
      scene.worldBounds,
    ).map((obj) => {
      const json = obj.toSaveJSON() as GameObjJson;
      json.id = obj.id;
      return json;
    });

    if (!authUser) {
      console.log('saving map locally');
      unsavedMapStorage.set('objects', objects);
      return;
    }

    const isFork =
      this.id && this.meta?.user && this.meta.user.id !== authUser.id;

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
    this.slug = map.slug;
    this.meta = map;

    unsavedMapStorage.clear();

    // TODO: put this somewhere else?
    const currentSlug = Router.pathname.match(/\/edit\/([^/]+)/)?.[1];
    if (currentSlug !== map.slug) {
      void Router.replace(`/edit/${map.slug}`);
    }
  }

  queueSave = _.debounce(this.save.bind(this), 3000);
}
