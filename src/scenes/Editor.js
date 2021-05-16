import Phaser from 'phaser';

import ToolManager from 'src/tools/ToolManager';
import { MapSaver, settingsSaver } from 'lib/saver';
import { EDITOR_TOOL_TYPES } from 'src/tools';
import { fitCameraToObjs, getObjectsBounds } from 'src/lib/utils';

export default class Editor extends Phaser.Scene {
  constructor() {
    super({
      key: 'Editor',
    });
  }

  init(data) {
    this.mapKey = data.mapKey;

    this.mapSaver = new MapSaver(this.mapKey);

    this.ui = this.scene.get('EditorUI');
  }

  /** @type import('./EditorUI').default */
  ui;

  /** @type {Phaser.GameObjects.GameObject[]} */
  selected = [];

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

  iGridSize = 10;
  gridSize;

  deleteSelected = (e) => {
    e?.preventDefault?.();
    for (const obj of this.selected || []) obj.destroy();
    this.events.emit('setSelected', []);
  };

  enableSnapping(enabled) {
    settingsSaver.set('snapping', enabled);

    this.gridObj.setVisible(enabled).setActive(enabled);

    this.gridSize = enabled ? this.iGridSize : null;
  }

  snapToGrid(obj) {
    if (this.gridSize) {
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

    this.gridObj = this.add.grid(
      0,
      0,
      this.iGridSize * 300,
      this.iGridSize * 300,
      this.iGridSize,
      this.iGridSize,
      0x000000,
      1,
      0x444444,
    );
    this.enableSnapping(!!settingsSaver.get('snapping'));

    this.parts = this.add.group();
    this.mapSaver.load().then((mapData) => {
      if (mapData) {
        MapSaver.loadEditorParts(mapData, this.parts);

        fitCameraToObjs(this.cameras.main, this.parts.getChildren());
      }
    });

    this.tm = new ToolManager(this, EDITOR_TOOL_TYPES[0], ['nav']);

    this.input.on('pointerup', () => this.saveLevel());
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
}
