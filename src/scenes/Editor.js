import Phaser from 'phaser';

import ToolManager from 'src/tools/ToolManager';
import { MapSaver, settingsSaver } from 'lib/saver';
import { EDITOR_TOOL_TYPES } from 'src/tools';
import { fitCameraToObjs, groupByIntersection, mergeGeoms } from 'lib/utils';
import { config } from 'src/const';
import { Polygon } from 'src/objects/Polygon';

import { BaseScene } from './Scene';

export default class Editor extends BaseScene {
  /** @type {Phaser.GameObjects.GameObject[]} */
  selected;

  /** @type {Phaser.GameObjects.Shape} */
  cursor;

  /** @type {MapSaver} */
  mapSaver;

  constructor() {
    super({
      key: 'Editor',
    });
  }

  init(data) {
    this.mapKey = data.mapKey;

    this.mapSaver = new MapSaver(this.mapKey);

    this.selected = [];
  }

  createListeners() {
    this.cursors = this.input.keyboard.createCursorKeys();

    this.input.keyboard.on('keydown-BACKSPACE', this.deleteSelected);
    this.input.keyboard.on('keydown-DELETE', this.deleteSelected);

    this.input.keyboard.on('keydown-T', () => {
      this.game.setScene('Play', {
        mapKey: this.mapKey,
      });
    });
  }

  iGridSize = 10 * config.gameScale;
  gridSize;

  deleteSelected = (e) => {
    e?.preventDefault?.();
    for (const obj of this.selected || []) obj.destroy();
    this.events.emit('setSelected', []);
  };

  duplicateSelected() {
    const offset = 10;
    const newObjs = this.selected.map((obj) => {
      const newObj = obj.clone();
      newObj.setPosition(obj.x + offset, obj.y + offset);
      this.parts.add(newObj);

      return newObj;
    });

    this.events.emit('setSelected', newObjs);
  }

  mergeSelected() {
    const groups = groupByIntersection(this.selected);

    let someMerged = false;

    const resultObjs = groups.map((g) => {
      if (g.length === 1) return g[0];

      const mergedPolygon = mergeGeoms(g.map((obj) => obj.geom));

      const part = new Polygon(this, 0, 0, mergedPolygon);
      part.localizePoints();

      for (const obj of g) obj.destroy();

      this.parts.add(part);

      someMerged = true;

      return part;
    });

    if (!someMerged) this.events.emit('showFlash', 'Objects must be touching!');

    this.events.emit('setSelected', resultObjs);
  }

  enableSnapping(enabled) {
    settingsSaver.set('snapping', enabled);

    this.events.emit('setGridSnapping', enabled);

    this.gridObj.setVisible(enabled).setActive(enabled);

    this.gridSize = enabled ? this.iGridSize : null;
  }

  get snappingEnabled() {
    return !!this.gridSize;
  }
  snapToGrid(obj) {
    if (this.snappingEnabled) {
      const offsetX = obj.originX != null ? obj.originX * obj.width : 0;
      const offsetY = obj.originY != null ? obj.originY * obj.height : 0;
      obj.x =
        this.gridSize * Math.floor((obj.x - offsetX) / this.gridSize) + offsetX;
      obj.y =
        this.gridSize * Math.floor((obj.y - offsetY) / this.gridSize) + offsetY;
      return true;
    }
    return false;
  }

  async saveLevel(force = false) {
    // this.parts.isDirty();
    if (force) {
      await this.mapSaver.save(this.parts);
    } else {
      this.mapSaver.queueSave(this.parts);
    }
  }

  create() {
    this.createListeners();

    this.worldBounds = new Phaser.Geom.Rectangle(
      (-this.iGridSize * 300) / 2,
      (-this.iGridSize * 300) / 2,
      this.iGridSize * 300,
      this.iGridSize * 300,
    );

    this.add
      .rectangle(
        this.worldBounds.centerX,
        this.worldBounds.centerY,
        this.worldBounds.width,
        this.worldBounds.height,
      )
      .setStrokeStyle(4, 0xffffff);

    this.gridObj = this.add.grid(
      this.worldBounds.centerX,
      this.worldBounds.centerY,
      this.worldBounds.width,
      this.worldBounds.height,
      this.iGridSize,
      this.iGridSize,
      0x000000,
      1,
      0x444444,
    );
    this.enableSnapping(!!settingsSaver.get('snapping'));

    this.parts = this.add.group();
    this.mapSaver.load().then((mapData) => {
      if (this.game.destroyed) return;
      if (mapData) {
        MapSaver.loadEditorParts(mapData, this.parts);

        fitCameraToObjs(this.cameras.main, this.parts.getChildren());
      }
    });

    this.tm = new ToolManager(this, EDITOR_TOOL_TYPES[0], ['nav']);

    this.input.on('pointerup', () => this.saveLevel());
    this.input.keyboard.on('keyup', () => this.saveLevel());
  }

  update(_t, delta) {
    const CAMERA_SPEED = (0.4 * delta) / this.cameras.main.zoom;
    const { left, right, up, down } = this.cursors;
    if (left.isDown && !right.isDown) {
      this.cameras.main.scrollX -= CAMERA_SPEED;
    } else if (right.isDown && !left.isDown) {
      this.cameras.main.scrollX += CAMERA_SPEED;
    }
    if (up.isDown && !down.isDown) {
      this.cameras.main.scrollY -= CAMERA_SPEED;
    } else if (down.isDown && !up.isDown) {
      this.cameras.main.scrollY += CAMERA_SPEED;
    }
  }

  shutdown() {
    this.tm?.destroy();
    this.tm = null;
  }
}
