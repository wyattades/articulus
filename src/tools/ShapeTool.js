import Phaser from 'phaser';

import { Rectangle, Ellipse, Polygon } from 'src/objects/Shape';

import BoxTool from './BoxTool';
import Tool from './Tool';

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
        this.shape.width >= MIN_SHAPE_SIZE &&
        this.shape.height >= MIN_SHAPE_SIZE
      ) {
        this.scene.parts.add(this.shape);
      } else this.shape.destroy();

      // remove reference so BoxTool doesn't destroy our shape
      this.shape = null;
    }
  }

  updateShape() {
    const { x, y, width, height } = this.box;

    const s = { x, y };
    const w = { x: x + width, y: y + height };

    this.scene.snapToGrid(s);
    this.scene.snapToGrid(w);

    const sw = w.x - s.x;
    const sh = w.y - s.y;

    this.shape.setPosition(s.x + sw / 2, s.y + sh / 2);
    this.shape.setSize(sw, sh);

    this.shape.rerender();
  }
}

export class EllipseTool extends ShapeTool {
  createShape() {
    return new Ellipse(this.scene, 0, 0);
  }

  updateShape() {
    const { ix, iy, width, height } = this.box;

    const ip = { x: ix, y: iy };
    const w = { x: ix + width, y: iy + height };

    this.scene.snapToGrid(ip);
    this.scene.snapToGrid(w);

    const sw = w.x - ip.x;
    const sh = w.y - ip.y;

    this.shape.setPosition(ip.x, ip.y);
    this.shape.setSize(sw * 2, sh * 2);

    this.shape.rerender();
  }
}

export class PolygonTool extends Tool {
  handlePointerDown(x, y) {
    const shape = new Polygon(this.scene, x, y);

    shape.polygon.setTo(
      '1 176 23 47 145 1 151 59 79 87 115 176 274 259 304 169 201 47 248 11 397 183 363 319 175 313 1 176',
      //   [
      //   0, 143, 0, 92, 110, 140, 244, 4, 330, 0, 458, 12, 574, 18, 600, 79, 594,
      //   153, 332, 152, 107, 157,
      // ]
    );
    const b = Phaser.Geom.Polygon.GetAABB(shape.polygon);

    for (const p of shape.polygon.points) {
      p.x -= b.centerX;
      p.y -= b.centerY;
    }
    shape.computeSize();

    this.scene.parts.add(shape);

    shape.rerender();
  }
}
