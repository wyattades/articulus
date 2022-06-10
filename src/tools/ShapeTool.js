import BoxTool from './BoxTool';

export const MIN_SHAPE_SIZE = 10;

export default class ShapeTool extends BoxTool {
  fillColor = 0x00ff00;
  fillOpacity = 1;

  allowGridSnapping = true;

  createShape() {
    return new this.ShapeClass(this.scene, 0, 0);
  }

  handleCreateBox() {
    if (this.shape) {
      if (
        this.shape.width >= MIN_SHAPE_SIZE &&
        this.shape.height >= MIN_SHAPE_SIZE
      ) {
        this.shape.saveRender();
        this.scene.parts.add(this.shape);
      } else this.shape.destroy();

      // remove reference so BoxTool doesn't destroy our shape
      this.shape = null;
    }
  }

  updateShape() {
    const { x, y, width, height } = this.box;

    const sw = x + width - x;
    const sh = y + height - y;

    this.shape.setPosition(x + sw / 2, y + sh / 2);
    this.shape.setSize(sw, sh);

    this.shape.rerender();
  }
}

export class EllipseTool extends ShapeTool {
  updateShape() {
    const { ix, iy, width, height } = this.box;

    const sw = ix + width - ix;
    const sh = iy + height - iy;

    this.shape.setPosition(ix, iy);
    this.shape.setSize(sw * 2, sh * 2);

    this.shape.rerender();
  }
}
