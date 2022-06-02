import { Polygon } from 'src/objects/Shape';

import Tool from './Tool';

export default class PenTool extends Tool {
  createPolygon(x, y) {
    const shape = new Polygon(this.scene);

    shape.polygon.setTo(
      '1 176 23 47 145 1 151 59 79 87 115 176 274 259 304 169 201 47 248 11 397 183 363 319 175 313 1 176',
      //   [
      //   0, 143, 0, 92, 110, 140, 244, 4, 330, 0, 458, 12, 574, 18, 600, 79, 594,
      //   153, 332, 152, 107, 157,
      // ]
    );

    for (const p of shape.polygon.points) {
      p.x += x;
      p.y += y;
    }
    shape.localizePoints();

    this.scene.parts.add(shape);

    shape.rerender();
  }

  handlePointerDown(x, y) {
    this.createPolygon(x, y);
  }
}
