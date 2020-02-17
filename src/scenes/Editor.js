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

  gridSize;

  enableSnapping(enabled) {
    settingsSaver.set('snapping', enabled);

    this.gridObj.setVisible(enabled).setActive(enabled);

    this.gridSize = enabled ? 10 : null;
  }

  snapToGrid(obj) {
    if (this.gridSize) {
      const offsetX = obj.originX != null ? obj.originX * obj.width : 0;
      const offsetY = obj.originY != null ? obj.originY * obj.height : 0;
      obj.x =
        this.gridSize * Math.floor((obj.x - offsetX) / this.gridSize) + offsetX;
      obj.y =
        this.gridSize * Math.floor((obj.y - offsetY) / this.gridSize) + offsetY;
      if (obj.setPosition) obj.setPosition(obj.x, obj.y);
    }
    return obj;
  }

  async saveLevel(force = false) {
    // this.parts.isDirty();
    if (force) await this.mapSaver.save(this.parts);
    else await this.mapSaver.queueSave(this.parts);
  }

  create() {
    this.createListeners();

    this.gridObj = this.add.grid(
      0,
      0,
      this.gridSize * 300,
      this.gridSize * 300,
      this.gridSize,
      this.gridSize,
      0x000000,
      1,
      0x444444,
    );
    this.enableSnapping(settingsSaver.get('snapping'));

    this.parts = this.add.group();
    this.mapSaver
      .load()
      .then((mapData) => MapSaver.loadEditorParts(mapData, this.parts));

    this.tm = new ToolManager(this, EDITOR_TOOL_TYPES[0], ['nav']);

    this.time.addEvent({
      loop: true,
      delay: 1000,
      callback: () => this.saveLevel(),
    });
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
