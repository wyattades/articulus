import throttle from 'lodash/throttle';
import * as R from 'ramda';

import { SHAPE_TYPE_CLASSES } from '../objects/Shape';
import { Subject } from './async';

/**
 * @typedef {{ x: number, y: number, width: number, height: number, type: string }[]} MapData
 */

/**
 * @typedef {{ name: string, _rev: string, _id: string }[]} MapMeta
 */

export class MapSaver {
  static metaCache = {};

  static db = null;

  static initter = null;

  static async init() {
    if (MapSaver.initter) return MapSaver.initter.toPromise();
    MapSaver.initter = new Subject();

    const { default: PouchDB } = await import('pouchdb');
    const { default: PouchDBFind } = await import('pouchdb-find');

    PouchDB.plugin(PouchDBFind);

    MapSaver.db = new PouchDB('fc');

    MapSaver.initter.complete();
  }

  static charSample = [
    ...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  ];
  static genId(size = 8) {
    return [...new Array(size)]
      .map(
        () =>
          MapSaver.charSample[
            Math.floor(Math.random() * MapSaver.charSample.length)
          ],
      )
      .join('');
  }

  objs = null;
  id = null;
  rev = null;
  name = null;

  static async loadLevelsMeta() {
    await MapSaver.init();

    const { rows: levels } = await MapSaver.db.allDocs({
      include_docs: true,
    });

    return levels.map((l) => {
      const meta = {
        id: l.id,
        rev: l.value.rev,
        name: l.doc.name,
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
        this.rev = meta.rev;
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

      // group.scene.matter.add.gameObject(obj, {
      //   isStatic: true,
      //   shape: obj.physicsShape,
      // });

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

    const doc = await MapSaver.db.get(this.id);

    this.id = doc._id;
    this.rev = doc._rev;
    this.name = doc.name;

    this.objs = doc.objs;

    return doc.objs;
  }

  /**
   * @param {Phaser.GameObjects.Group} group
   */
  async save(group) {
    await MapSaver.init();

    const serialized = R.map(
      R.pick(['x', 'y', 'width', 'height', 'type']),
      group.getChildren(),
    );

    const data = {
      name: this.name,
      objs: serialized,
    };

    const res = await MapSaver.db.put({
      ...data,
      _id: this.id || MapSaver.genId(),
      _rev: this.rev || undefined,
    });

    this.id = res.id;
    this.rev = res.rev;
  }

  queueSave = throttle(this.save.bind(this), 400);
}
