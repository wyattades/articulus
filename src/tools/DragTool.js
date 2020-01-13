/* eslint-disable consistent-return */
// import Phaser from 'phaser';

import Tool from './Tool';

export default class DragTool extends Tool {
  dragging = null;

  handlePointerDown(x, y, pointer, topObject) {
    if (topObject) {
      let dragging;

      const selected = this.scene.selected;
      if (
        selected &&
        selected.length > 0 &&
        selected.indexOf(topObject) !== -1
      ) {
        // if (selected.indexOf(topObject) !== -1) {
        dragging = selected;
        // }
      } else {
        dragging = [topObject];
      }

      if (dragging) {
        this.dragging = dragging.map((obj) => ({
          obj,
          dx: obj.x - x,
          dy: obj.y - y,
        }));

        // return false;
      }
    }
  }

  handlePointerMove(x, y) {
    if (this.dragging) {
      this.dragging.moved = true;
      for (const { obj, dx, dy } of this.dragging)
        obj.setPosition(x + dx, y + dy);
      return false;
    }
  }

  handlePointerUp() {
    if (this.dragging) {
      const moved = this.dragging.moved;
      this.dragging = null;
      if (moved) return false;
    }
  }
}
