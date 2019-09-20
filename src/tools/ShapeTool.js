import Phaser from 'phaser';

import SelectTool from './SelectTool';
import Part from '../objects/Part';

class Rectangle extends Part {
  fillColor = 0x00ff00;
  fillOpacity = 1;
  strokeColor = 0xffffff;
  strokeOpacity = 0;
  width = 1;
  height = 1;

  setSize(width, height) {
    this.width = width;
    this.height = height;
  }

  render() {
    this.clear();
    this.fillStyle(this.fillColor, this.fillOpacity);
    this.lineStyle(2, this.strokeColor, this.strokeOpacity);
    this.fillRect(0, 0, this.width, this.height);
    this.strokeRect(0, 0, this.width, this.height);
  }

  get geom() {
    return new Phaser.Geom.Rectangle(this.x, this.y, this.width, this.height);
  }

  initListeners() {
    this.setInteractive(this.geom, (geom, dx, dy, obj) => {
      geom.x = obj.x;
      geom.y = obj.y;
      return geom.contains(obj.x + dx, obj.y + dy);
    });

    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (pointer) => {
      pointer.dragObj = this;
    });
  }
}

class Ellipse extends Rectangle {
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
}

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
