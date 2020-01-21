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
        this.shape.initListeners();
        this.scene.parts.add(this.shape);
      } else this.shape.destroy();

      // remove reference so BoxTool doesn't destroy our shape
      this.shape = null;
    }
  }

  updateShape() {
    const { x, y, width, height } = this.box;
    this.shape.setPosition(x + width / 2, y + height / 2);
    this.shape.setSize(width, height);
    this.shape.render();
  }
}

export class EllipseTool extends ShapeTool {
  createShape() {
    return new Ellipse(this.scene, 0, 0);
  }

  updateShape() {
    const { ix, iy, width, height } = this.box;
    this.shape.setPosition(ix, iy);
    this.shape.setSize(width * 2, height * 2);
    this.shape.render();
  }
}
