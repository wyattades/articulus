// import Phaser from 'phaser';

import BoxTool from './BoxTool';
import { Rectangle, Ellipse } from '../objects/Shape';

export const MIN_SHAPE_SIZE = 10;

export default class ShapeTool extends BoxTool {
  fillColor = 0x00ff00;
  fillOpacity = 1;

  createShape() {
    return new Rectangle(this.scene, 0, 0);
  }

  handleCreateBox(_intersected) {
    if (this.shape) {
      if (
        this.shape.width > MIN_SHAPE_SIZE &&
        this.shape.height > MIN_SHAPE_SIZE
      ) {
        this.scene.parts.add(this.shape);
      } else this.shape.destroy();

      // remove reference so BoxTool doesn't destroy our shape
      this.shape = null;
    }
  }

  updateShape() {
    const { x, y, width, height } = this.box;

    const { x: sx, y: sy } = this.scene.snapToGrid({ x, y });
    const { x: wx, y: hy } = this.scene.snapToGrid({
      x: x + width,
      y: y + height,
    });
    const sw = wx - sx;
    const sh = hy - sy;

    this.shape.setPosition(sx + sw / 2, sy + sh / 2);
    this.shape.setSize(sw, sh);
    this.shape.render();
  }
}

export class EllipseTool extends ShapeTool {
  createShape() {
    return new Ellipse(this.scene, 0, 0);
  }

  updateShape() {
    const { ix, iy, width, height } = this.box;

    const { x: sx, y: sy } = this.scene.snapToGrid({ x: ix, y: iy });
    const { x: wx, y: hy } = this.scene.snapToGrid({
      x: ix + width,
      y: iy + height,
    });
    const sw = wx - sx;
    const sh = hy - sy;

    this.shape.setPosition(sx, sy);
    this.shape.setSize(sw * 2, sh * 2);
    this.shape.render();
  }
}
