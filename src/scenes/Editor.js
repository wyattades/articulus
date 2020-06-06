import Phaser from 'phaser';

import ToolManager from '../tools/ToolManager';
import { MapSaver, settingsSaver } from '../lib/saver';
import { EDITOR_TOOL_TYPES } from '../tools';

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

    this.input.keyboard.on('keydown-BACKSPACE', (e) => {
      e.preventDefault();
      for (const obj of this.selected || []) this.parts.remove(obj, true, true);
      this.events.emit('setSelected', []);
    });
  }

  iGridSize = 10;
  gridSize;

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
      this.debounceSave?.destroy();
      this.debounceSave = this.time.delayedCall(1000, () => {
        this.mapSaver.queueSave(this.parts);
      });
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

    // TODO: necessary?
    this.cursor = this.add
      .circle(0, 0, 6, 0xeeeeee)
      .setStrokeStyle(1, 0xbbbbbb)
      .setVisible(false)
      .setDepth(1000);

    this.parts = this.add.group();
    this.mapSaver
      .load()
      .then((mapData) => MapSaver.loadEditorParts(mapData, this.parts));

    this.tm = new ToolManager(this, EDITOR_TOOL_TYPES[0], ['nav']);

    this.input.on('pointerup', () => this.saveLevel());
  }

  update(_, delta) {
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
