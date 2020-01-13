import throttle from 'lodash/throttle';
import * as R from 'ramda';

import { SHAPE_TYPE_CLASSES } from '../objects/Shape';

/**
 * @typedef {{ x: number, y: number, width: number, height: number, type: string }[]} MapData
 */

export class MapSaver {
  static STORAGE_KEY_PREFIX = 'fc:map:';

  static *loadLevelsMeta() {
    const len = localStorage.length;
    for (let i = 0; i < len; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const match = key.match(`^${MapSaver.STORAGE_KEY_PREFIX}(.+)$`);
      if (match) {
        yield {
          key: match[1],
          name: match[1],
        };
      }
    }
  }

  constructor(key) {
    this.setKey(key);
  }

  setKey(key) {
    this.storageKey = `${MapSaver.STORAGE_KEY_PREFIX}${key}`;
  }

  load() {
    let objects;

    try {
      objects = JSON.parse(localStorage.getItem(this.storageKey));
    } catch (_) {}

    if (!objects || !Array.isArray(objects)) return [];

    return objects;
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

  /**
   * @param {Phaser.GameObjects.Group} group
   */
  save(group) {
    const serialized = R.map(
      R.pick(['x', 'y', 'width', 'height', 'type']),
      group.getChildren(),
    );

    localStorage.setItem(this.storageKey, JSON.stringify(serialized));
  }

  queueSave = throttle(this.save.bind(this), 400);
}
