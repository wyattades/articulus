import Phaser from 'phaser';

// import { Matter } from '../lib/physics';
import Part from './Part';

export default class Line extends Part {
  static MIN_LENGTH = 40;

  type = 'line';
  fillColor = 0xffffff;

  constructor(scene, x1, y1, x2, y2, lineWidth = 10) {
    super(scene, x1, y1);

    this.size = lineWidth;
    this._x1 = x1;
    this._y1 = y1;

    // this.enablePhysics();
    // this.setOrigin(0, 0.5);
    setTimeout(() => this.setEnd(x2, y2));
  }

  get cosX() {
    return Math.cos(this.rotation) * this.length;
  }

  get cosY() {
    return Math.sin(this.rotation) * this.length;
  }

  get x1() {
    return this.x - this.cosX / 2;
  }

  get y1() {
    return this.y - this.cosY / 2;
  }

  get x2() {
    return this.x + this.cosX / 2;
  }

  get y2() {
    return this.y + this.cosY / 2;
  }

  // this only works before calling enablePhysics
  setEnd(x2, y2) {
    const { _x1: x1, _y1: y1 } = this;

    this.length = Math.max(
      Line.MIN_LENGTH,
      Phaser.Math.Distance.Between(x1, y1, x2, y2),
    );

    this.setRotation(Phaser.Math.Angle.Between(x1, y1, x2, y2));

    this.x = x1 + this.cosX / 2;
    this.y = y1 + this.cosY / 2;
    this.redraw();

    // this.body.position.x = this.x;
    // this.body.position.y = this.y;
    // this.body.angle = this.rotation;
    // this.setSize(this.length, this.size);
  }

  redraw() {
    this.clear();
    // this.lineStyle(2, 0x0000ff, 1);
    // this.strokeRoundedRect(
    //   -this.length / 2 - this.size / 2,
    //   -this.size / 2,
    //   this.length + this.size,
    //   this.size,
    //   this.size / 2,
    // );
    this.fillStyle(this.fillColor);
    this.fillRoundedRect(
      -this.length / 2 - this.size / 2,
      -this.size / 2,
      this.length + this.size,
      this.size,
      this.size / 2,
    );
  }

  enablePhysics(isStatic = false) {
    // this.setOrigin(0.5, 0.5);
    // this.x += this.cosX / 2;
    // this.y += this.cosY / 2;

    this.scene.matter.add.gameObject(this, {
      shape: {
        type: 'rectangle',
        x: this.x,
        y: this.y,
        width: this.length,
        height: this.size,
      },
      angle: this.rotation,
      isStatic,
    });

    return this;
  }

  getHoverPoint(x, y, dist) {
    const { x1, y1 } = this;
    if (Phaser.Math.Distance.Between(x, y, x1, y1) < dist)
      return { x: x1, y: y1 };
    const { x2, y2 } = this;
    if (Phaser.Math.Distance.Between(x, y, x2, y2) < dist)
      return { x: x2, y: y2 };
    return null;
  }
}
