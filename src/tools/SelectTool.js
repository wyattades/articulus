import Phaser from 'phaser';

import Tool from './Tool';
import { intersectsGeoms } from '../lib/utils';

export default class SelectTool extends Tool {
  fillColor = 0xffffff;
  fillOpacity = 0.3;

  setSelected(selected) {
    this.scene.selected = selected;
    for (const child of selected) {
      child.strokeColor = 0xffffff;
      child.render();
    }
  }

  updateGeom() {
    this.box.geom.setTo(
      this.box.x,
      this.box.y,
      Math.max(1, this.box.width),
      Math.max(1, this.box.height),
    );
  }

  handlePointerDown(x, y) {
    if (this.box) return;

    this.box = this.scene.add.rectangle(
      x,
      y,
      1,
      1,
      this.fillColor,
      this.fillOpacity,
    );
    this.box.ix = x;
    this.box.iy = y;
    this.updateGeom();
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
      this.updateGeom();
    }
  }

  handlePointerUp() {
    if (this.box) {
      const boxGeom =
        this.box.width + this.box.height < 4
          ? new Phaser.Geom.Point(this.box.x, this.box.y)
          : this.box.geom;
      const selected = this.scene.parts
        .getChildren()
        .filter((child) => intersectsGeoms(boxGeom, child.geom));

      this.setSelected(selected);

      this.box.destroy();
      this.box = null;
    }
  }
}
