import Phaser from 'phaser';

import { getTopObject } from 'lib/utils';
import { intersectsGeoms } from 'lib/intersects';
import { Part } from 'src/objects';

import Tool from './Tool';

type Shape = Part | Phaser.GameObjects.Rectangle;

export default class BoxTool extends Tool {
  fillColor = 0xffffff;
  fillOpacity = 0.3;

  allowStartOverlapping = true;
  allowGridSnapping = false;

  box?: Phaser.Geom.Rectangle & { ix: number; iy: number; moved?: boolean };

  shape?: Shape;

  handleCreateBox() {}

  getBoxIntersections() {
    const box = this.box!;

    const boxGeom =
      box.width + box.height < 4 ? new Phaser.Geom.Point(box.x, box.y) : box;

    const intersected = this.scene
      .getParts()
      .filter((child) => intersectsGeoms(boxGeom, child.geom));

    return intersected;
  }

  updateShape() {
    const { x, y, width, height } = this.box!;
    this.shape!.setPosition(x, y);
    this.shape!.setSize(width, height);
    if (this.shape instanceof Part) this.shape.rerender();
  }

  createShape(): Shape {
    return this.scene.add
      .rectangle(0, 0, 1, 1, this.fillColor, this.fillOpacity)
      .setOrigin(0, 0);
  }

  handlePointerDown(x: number, y: number) {
    this.clearBox();

    if (this.allowGridSnapping) {
      const p = { x, y };
      this.scene.snapToGrid(p);
      x = p.x;
      y = p.y;
    }

    this.box = new Phaser.Geom.Rectangle(x, y, 1, 1) as NonNullable<
      typeof this['box']
    >;
    this.box.ix = x;
    this.box.iy = y;

    if (this.allowStartOverlapping || !getTopObject(this.scene, x, y)) {
      this.shape = this.createShape();
      this.updateShape();
    }
  }

  handlePointerMove(x: number, y: number) {
    if (this.allowGridSnapping) {
      const p = { x, y };
      this.scene.snapToGrid(p);
      x = p.x;
      y = p.y;
    }

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

  handlePointerUp() {
    if (this.box) {
      if (this.shape || !this.box.moved) {
        this.handleCreateBox();
      }

      this.clearBox();
    }
  }

  clearBox() {
    this.box = undefined;

    if (this.shape) {
      this.shape.destroy();
      this.shape = undefined;
    }
  }
}
