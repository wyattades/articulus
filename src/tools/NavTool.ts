import { constrain } from 'lib/utils';

import Tool from './Tool';

export default class NavTool extends Tool {
  dragView: {
    x: number;
    y: number;
  } | null = null;

  _em = this.eventManager
    .on(this.scene.game.canvas, 'contextmenu', (e: Event) => {
      // disable right-click menu
      e.preventDefault();
    })
    .on(this.scene.game.canvas, 'wheel', this.onScroll.bind(this));

  onScroll(e: WheelEvent) {
    e.preventDefault();
    const camera = this.scene.cameras.main;
    if (!camera) return;

    let dirX = Math.sign(e.deltaX);
    let dirY = Math.sign(e.deltaY);

    if (e.shiftKey && !e.deltaX) {
      dirX = dirY;
      dirY = 0;
    }

    if (e.ctrlKey) {
      // ctrl-scroll & pinch-to-zoom

      camera.setZoom(
        constrain(camera.zoom + dirY * -0.05 * camera.zoom, 0.2, 10),
      );
    } else {
      // scroll & shift-scroll
      const l = 3000;
      const scale = (1.0 / camera.zoom) * 8.0;

      camera.setScroll(
        constrain(camera.scrollX + dirX * scale, -l, l),
        constrain(camera.scrollY + dirY * scale, -l, l),
      );
    }
  }

  handlePointerDown(
    _x: number,
    _y: number,
    { button, position }: Phaser.Input.Pointer,
  ) {
    // if (topObject) return;

    // right click or middle click
    if (button === 2 || button === 1) {
      const camera = this.scene.cameras.main;
      const invScale = camera.zoom;

      this.dragView = {
        x: camera.scrollX * invScale + position.x,
        y: camera.scrollY * invScale + position.y,
      };

      return false;
    }
  }

  handlePointerMove(
    _x: number,
    _y: number,
    { position }: Phaser.Input.Pointer,
  ) {
    if (this.dragView) {
      const camera = this.scene.cameras.main;

      const scale = 1 / camera.zoom;

      camera.setScroll(
        (this.dragView.x - position.x) * scale,
        (this.dragView.y - position.y) * scale,
      );
      return false;
    }
  }

  handlePointerUp(_x: number, _y: number, { button }: Phaser.Input.Pointer) {
    if (button === 2 || button === 1) {
      this.dragView = null;
      return false;
    }
  }
}
