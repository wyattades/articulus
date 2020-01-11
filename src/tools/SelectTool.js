import Phaser from 'phaser';
import * as R from 'ramda';

import Tool from './Tool';
import { intersectsGeoms } from '../lib/utils';

export default class SelectTool extends Tool {
  fillColor = 0xffffff;
  fillOpacity = 0.3;

  shiftKey = this.scene.input.keyboard.addKey(
    Phaser.Input.Keyboard.KeyCodes.SHIFT,
  );

  /** @type Phaser.Geom.Rectangle */
  box;

  /**
   * @param {Phaser.GameObjects.GameObject[]} selected
   */
  setSelected(selected) {
    const currentSelected = this.scene.selected || [];
    this.scene.selected = this.shiftKey.isDown
      ? R.union(currentSelected, selected)
      : selected;

    for (const child of R.difference(currentSelected, this.scene.selected)) {
      child.strokeOpacity = 0;
      if (child.render) child.render();
    }

    for (const child of R.difference(this.scene.selected, currentSelected)) {
      child.strokeOpacity = 1;
      if (child.render) child.render();
    }
  }

  setSelectedFromBox() {
    if (!this.box) return;

    const boxGeom =
      this.box.width + this.box.height < 4
        ? new Phaser.Geom.Point(this.box.x, this.box.y)
        : this.box;

    const selected = this.scene.parts
      .getChildren()
      .filter((child) => intersectsGeoms(boxGeom, child.geom));

    this.setSelected(selected);
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

  handlePointerDown(x, y) {
    this.clearBox();

    this.shape = this.createShape();
    this.box = new Phaser.Geom.Rectangle(x, y, 1, 1);
    this.box.ix = x;
    this.box.iy = y;
    this.updateShape();

    this.setSelectedFromBox();
  }

  handlePointerMove(x, y) {
    if (this.box) {
      const { ix, iy } = this.box;
      if (x < ix) {
        this.box.width = ix - x;
        this.box.x = x;
      } else this.box.width = x - ix;
      if (y < iy) {
        this.box.height = iy - y;
        this.box.y = y;
      } else this.box.height = y - iy;
      this.updateShape();
    }
  }

  handlePointerUp() {
    if (this.box) {
      this.setSelectedFromBox();
      this.clearBox();
    }
  }

  clearBox() {
    if (this.box) {
      this.shape.destroy();
      this.shape = null;
      // this.box.destroy();
      this.box = null;
    }
  }
}
