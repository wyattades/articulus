/* eslint-disable consistent-return */
// import Phaser from 'phaser';

import Tool from './Tool';

export default class DragTool extends Tool {
  setDragging(dragging, x, y) {
    this.scene.dragging = dragging;
    this.scene.events.emit('setDragging', dragging, x, y);
  }

  get dragging() {
    return this.scene.dragging;
  }

  handlePointerDown(x, y, pointer, topObject) {
    if (topObject) {
      let dragging;

      const selected = this.scene.selected;
      if (
        selected &&
        selected.length > 0 &&
        selected.indexOf(topObject) !== -1
      ) {
        dragging = selected;
      } else {
        dragging = [topObject];
      }

      if (dragging) {
        this.setDragging(
          dragging.map((obj) => ({
            obj,
            dx: obj.x - x,
            dy: obj.y - y,
          })),
          x,
          y,
        );

        // return false;
      }
    }
  }

  handlePointerMove(x, y) {
    if (this.dragging) {
      this.dragging.moved = true;

      for (const { obj, dx, dy, afterUpdate } of this.dragging) {
        // `obj` may be `Controls`, which is a `Group` with a custom `setPosition` method
        // which should be called only once for performance
        const newPos = { x: x + dx, y: y + dy };
        this.scene.snapToGrid(newPos);
        obj.setPosition(newPos.x, newPos.y);

        if (afterUpdate) afterUpdate(newPos.x, newPos.y);
      }
      return false;
    }
  }

  handlePointerUp() {
    if (this.dragging) {
      const moved = this.dragging.moved;
      this.setDragging(null);
      if (moved) return false;
    }
  }
}
