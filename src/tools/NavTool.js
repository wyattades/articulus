import { EventManager, constrain } from 'lib/utils';

import Tool from './Tool';

export default class NavTool extends Tool {
  dragView = null;

  constructor(scene, toolKey) {
    super(scene, toolKey);

    this.eventManager = new EventManager()
      .on(scene.game.canvas, 'contextmenu', (e) => {
        // disable right-click menu
        e.preventDefault();
      })
      .on(scene.game.canvas, 'wheel', this.onScroll);
  }

  onScroll = (e) => {
    e.preventDefault();
    const camera = this.scene.cameras.main;

    let dirX = Math.sign(e.deltaX);
    let dirY = Math.sign(e.deltaY);

    if (e.shiftKey && !e.deltaX) {
      dirX = dirY;
      dirY = 0;
    }

    if (e.ctrlKey) {
      // ctrl-scroll & pinch-to-zoom

      camera.setZoom(constrain(camera.zoom - dirY * 0.4, 0.2, 10));
    } else {
      // scroll & shift-scroll
      const l = 3000;
      const scale = (1 / camera.zoom) * 10;

      camera.setScroll(
        constrain(camera.scrollX - dirX * scale, -l, l),
        constrain(camera.scrollY - dirY * scale, -l, l),
      );
    }
  };

  handlePointerDown(x, y, { button, position }) {
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

  handlePointerMove(x, y, { position }) {
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

  handlePointerUp(x, y, { button }) {
    if (button === 2 || button === 1) {
      this.dragView = null;
      return false;
    }
  }

  destroy() {
    this.eventManager.off();
  }
}
