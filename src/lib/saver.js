import throttle from 'lodash/throttle';
import * as R from 'ramda';
import PouchDB from 'pouchdb';
// import PouchDBDebug from 'pouchdb-debug';
import PouchDBFind from 'pouchdb-find';

import { SHAPE_TYPE_CLASSES } from '../objects/Shape';

PouchDB.plugin(PouchDBFind);
// PouchDB.plugin(PouchDBDebug);
// PouchDB.debug.enable('*');

/**
 * @typedef {{ x: number, y: number, width: number, height: number, type: string }[]} MapData
 */

/**
 * @typedef {{ name: string, _rev: string, _id: string }[]} MapMeta
 */

export class MapSaver {
  static metaCache = {};

  static db = new PouchDB('fc');

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

      group.scene.matter.add.gameObject(obj, {
        isStatic: true,
        shape: obj.physicsShape,
      });

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
      obj.initListeners();
      obj.render();

      group.add(obj);
    }
  }

  async load() {
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
