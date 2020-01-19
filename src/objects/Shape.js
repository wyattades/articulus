import Phaser from 'phaser';

import Part from './Part';

export class Rectangle extends Part {
  fillColor = 0x00ff00;
  fillOpacity = 1;
  strokeColor = 0xffffff;
  strokeOpacity = 1;
  strokeWidth = 2;
  width = 1;
  height = 1;
  originX = 0.5;
  originY = 0.5;
  type = 'rect';

  setSize(width, height) {
    this.width = width;
    this.height = height;
  }

  render() {
    this.clear();
    this.fillStyle(this.fillColor, this.fillOpacity);
    this.lineStyle(this.strokeWidth, this.strokeColor, this.strokeOpacity);
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
    // this.setInteractive(this.geom, (geom, dx, dy, obj) => {
    //   geom.x = obj.x - geom.width / 2;
    //   geom.y = obj.y - geom.height / 2;
    //   return geom.contains(obj.x + dx, obj.y + dy);
    // });
    // this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (pointer) => {
    //   pointer.dragObj = this;
    // });
  }
}

export class Ellipse extends Rectangle {
  type = 'ellipse';

  render() {
    this.clear();
    this.fillStyle(this.fillColor, this.fillOpacity);
    this.lineStyle(this.strokeWidth, this.strokeColor, this.strokeOpacity);
    this.fillEllipse(0, 0, this.width, this.height);
    this.strokeEllipse(0, 0, this.width, this.height);
  }

  get geom() {
    return new Phaser.Geom.Ellipse(this.x, this.y, this.width, this.height);
  }

  get physicsShape() {
    // this.scene.matter.add.rectangle()

    // Bodies.rectangle(200, 200, 200, 200, {
    //   chamfer: { radius: [150, 20, 150, 20] }
    // }),
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
