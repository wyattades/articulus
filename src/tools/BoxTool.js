import Phaser from 'phaser';

import Tool from './Tool';
import { intersectsGeoms } from '../lib/utils';

export default class BoxTool extends Tool {
  fillColor = 0xffffff;
  fillOpacity = 0.3;

  /** @type Phaser.Geom.Rectangle */
  box;

  allowStartOverlapping = true;

  /**
   * @param {import('../objects/Part').default[]} intersected
   */
  handleCreateBox(intersected) {}

  getBoxIntersections() {
    const boxGeom =
      this.box.width + this.box.height < 4
        ? new Phaser.Geom.Point(this.box.x, this.box.y)
        : this.box;

    const intersected = this.scene.parts
      .getChildren()
      .filter((child) => intersectsGeoms(boxGeom, child.geom));

    return intersected;
  }

  updateShape() {
    const { x, y, width, height } = this.box;
    this.shape.setPosition(x, y);
    this.shape.setSize(width, height);
    if (this.shape.render) this.shape.render();
  }

  createShape() {
    return this.scene.add
      .rectangle(0, 0, 1, 1, this.fillColor, this.fillOpacity)
      .setOrigin(0, 0);
  }

  handlePointerDown(x, y, pointer, topObject) {
    this.clearBox();

    this.box = new Phaser.Geom.Rectangle(x, y, 1, 1);
    this.box.ix = x;
    this.box.iy = y;

    if (this.allowStartOverlapping || !topObject) {
      this.shape = this.createShape();
      this.updateShape();
    }
  }

  handlePointerMove(x, y, pointer) {
    if (this.box) {
      this.box.moved = true;
      const { ix, iy } = this.box;
      if (x < ix) {
        this.box.width = ix - x;
        this.box.x = x;
      } else this.box.width = x - ix;
      if (y < iy) {
        this.box.height = iy - y;
        this.box.y = y;
      } else this.box.height = y - iy;

      if (this.shape) this.updateShape();
    }
  }

  handlePointerUp(x, y, pointer) {
    if (this.box) {
      if (this.shape || !this.box.moved) {
        this.handleCreateBox(this.getBoxIntersections());
      }

      this.clearBox();
    }
  }

  clearBox() {
    this.box = null;

    if (this.shape) {
      this.shape.destroy();
      this.shape = null;
    }
  }
}
