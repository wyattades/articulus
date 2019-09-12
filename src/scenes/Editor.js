import Phaser from 'phaser';

import { constrain } from '../lib/utils';
import ToolManager from '../tools/ToolManager';

const TOOL_TYPES = ['rectangle_shape', 'ellipse_shape', 'select', 'delete'];

export default class Editor extends Phaser.Scene {
  constructor() {
    super({
      key: 'Editor',
      // active: true,
    });
  }

  /** @type import('./EditorUI').default */
  ui;

  createListeners() {
    this.cursors = this.input.keyboard.createCursorKeys();

    this.game.canvas.addEventListener(
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
  }

  create() {
    this.ui = this.scene.get('EditorUI');
    this.tm = new ToolManager(this, TOOL_TYPES);

    this.createListeners();

    this.parts = this.add.group();

    // this.parts.
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
