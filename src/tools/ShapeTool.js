import Phaser from 'phaser';

import SelectTool from './SelectTool';
import Part from '../objects/Part';

export class Rectangle extends Part {
  fillColor = 0x00ff00;
  fillOpacity = 1;
  strokeColor = 0xffffff;
  strokeOpacity = 0;
  width = 1;
  height = 1;
  type = 'rect';

  setSize(width, height) {
    this.width = width;
    this.height = height;
  }

  render() {
    this.clear();
    this.fillStyle(this.fillColor, this.fillOpacity);
    this.lineStyle(2, this.strokeColor, this.strokeOpacity);
    this.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    this.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
  }

  get geom() {
    return new Phaser.Geom.Rectangle(
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height,
    );
  }

  get physicsShape() {
    return 'rectangle';
    // {
    //   type: 'rectangle',
    //   // x: this.x,
    //   // y: this.y,
    //   width: this.width,
    //   height: this.height,
    // };
  }

  initListeners() {
    this.setInteractive(this.geom, (geom, dx, dy, obj) => {
      geom.x = obj.x - geom.width / 2;
      geom.y = obj.y - geom.height / 2;
      return geom.contains(obj.x + dx, obj.y + dy);
    });

    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (pointer) => {
      pointer.dragObj = this;
    });
  }
}

export class Ellipse extends Rectangle {
  type = 'ellipse';

  render() {
    this.clear();
    this.fillStyle(this.fillColor, this.fillOpacity);
    this.lineStyle(2, this.strokeColor, this.strokeOpacity);
    this.fillEllipse(0, 0, this.width, this.height);
    this.strokeEllipse(0, 0, this.width, this.height);
  }

  get geom() {
    return new Phaser.Geom.Ellipse(this.x, this.y, this.width, this.height);
  }

  get physicsShape() {
    return {
      type: 'circle',
      // x: this.x,
      // y: this.y,
      radius: this.width / 2,
      // type: 'ellipse',
      // width: this.width,
      // height: this.height,
    };
  }
}

export const SHAPE_TYPE_CLASSES = {
  rect: Rectangle,
  ellipse: Ellipse,
};

export default class ShapeTool extends SelectTool {
  fillColor = 0x00ff00;
  fillOpacity = 1;

  createShape() {
    return new Rectangle(this.scene, 0, 0);
  }

  handlePointerUp() {
    if (this.box) {
      this.shape.initListeners();

      this.scene.parts.add(this.shape);

      this.shape = null;
      this.box = null;
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
    // return this.scene.add.ellipse(0, 0, 1, 1, this.fillColor, this.fillOpacity);
  }

  updateShape() {
    const { ix, iy, width, height } = this.box;
    this.shape.setPosition(ix, iy);
    this.shape.setSize(width * 2, height * 2);
    this.shape.render();
  }
}
