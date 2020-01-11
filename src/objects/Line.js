import Phaser from 'phaser';

import Part from './Part';

export default class Line extends Part {
  static MIN_LENGTH = 20;
  static type = 'line';

  constructor(scene, x1, y1, x2, y2, lineWidth = 10) {
    super(scene, x1, y1);

    this.size = lineWidth;
    this._x1 = x1;
    this._y1 = y1;

    this.setEnd(x2, y2);
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

    this.length = Math.max(1, Phaser.Math.Distance.Between(x1, y1, x2, y2));

    this.setRotation(Phaser.Math.Angle.Between(x1, y1, x2, y2));

    this.x = x1 + this.cosX / 2;
    this.y = y1 + this.cosY / 2;

    this.clear();
    this.render();
  }

  render() {
    this.fillStyle(this.fillColor);
    this.lineStyle(2, this.strokeColor, 1);
    this.fillRect(-this.length / 2, -this.size / 2, this.length, this.size);
    this.strokeRect(-this.length / 2, -this.size / 2, this.length, this.size);

    this.renderConnector(-this.length / 2, 0);
    this.renderConnector(this.length / 2, 0);
  }

  get physicsShape() {
    return {
      type: 'rectangle',
      x: this.x,
      y: this.y,
      width: this.length,
      height: this.size,
    };
  }

  get geom() {
    return new Phaser.Geom.Line(this.x1, this.y1, this.x2, this.y2);
  }

  updateTPos = () => {
    if (this.t) {
      this.t.x = this.x;
      this.t.y = this.y;
    }
  };

  getHoverPoint(x, y, dist) {
    dist *= dist;

    const { x1, y1 } = this;
    if (Phaser.Math.Distance.Squared(x, y, x1, y1) < dist)
      return { x: x1, y: y1 };
    const { x2, y2 } = this;
    if (Phaser.Math.Distance.Squared(x, y, x2, y2) < dist)
      return { x: x2, y: y2 };
    return null;
  }
}
