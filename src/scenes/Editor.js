import Phaser from 'phaser';

import { constrain, EventManager } from '../lib/utils';
import ToolManager from '../tools/ToolManager';
import { MapSaver } from '../lib/saver';
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

    this.eventManager = new EventManager().on(
      this.game.canvas,
      'wheel',
      (e) => {
        e.preventDefault();
        this.cameras.main.setZoom(
          // TODO: normalize zoom speed
          constrain(this.cameras.main.zoom + e.deltaY * 0.01, 0.2, 10),
        );
      },
      false,
    );

    this.events.on('shutdown', () => {
      this.eventManager.off();
    });
  }

  gridSize = 10;
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
    if (force) await this.mapSaver.save(this.parts);
    else await this.mapSaver.queueSave(this.parts);
  }

  create() {
    this.createListeners();

    if (this.gridSize) {
      this.add.grid(
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
    }

    this.parts = this.add.group();
    this.mapSaver
      .load()
      .then((mapData) => MapSaver.loadEditorParts(mapData, this.parts));

    this.tm = new ToolManager(this, EDITOR_TOOL_TYPES[0], ['nav']);

    // this.time.addEvent({
    //   loop: true,
    //   delay: 400,
    //   callback: () => this.saveLevel(),
    // });
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
