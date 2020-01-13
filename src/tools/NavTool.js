/* eslint-disable consistent-return */
// import Phaser from 'phaser';

import Tool from './Tool';
import { EventManager, constrain } from '../lib/utils';

export default class NavTool extends Tool {
  dragView = null;

  constructor(scene, toolKey) {
    super(scene, toolKey);

    this.eventManager = new EventManager()
      .on(scene.game.canvas, 'contextmenu', (e) => e.preventDefault())
      .on(scene.game.canvas, 'wheel', (e) => {
        e.preventDefault();
        scene.cameras.main.setZoom(
          // TODO: normalize zoom speed
          constrain(scene.cameras.main.zoom + e.deltaY * 0.01, 0.2, 10),
        );
      });
  }

  handlePointerDown(x, y, { button, position }, topObject) {
    // if (topObject) return;

    // right click
    if (button === 2) {
      const camera = this.scene.cameras.main;

      this.dragView = {
        x: camera.scrollX + position.x,
        y: camera.scrollY + position.y,
      };
      this.dragView.dx = x - camera.scrollX;
      this.dragView.dy = y - camera.scrollY;
      return false;
    }
  }

  handlePointerMove(x, y, { position }) {
    if (this.dragView) {
      this.scene.cameras.main.setScroll(
        this.dragView.x - position.x,
        this.dragView.y - position.y,
      );
      return false;
    }
  }

  handlePointerUp(x, y, { button }) {
    if (button === 2) {
      this.dragView = null;
      return false;
    }
  }

  destroy() {
    this.eventManager.off();
  }
}
