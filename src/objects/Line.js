import Phaser from 'phaser';

import { config } from 'src/const';

import Part from './Part';

export default class Line extends Part {
  static zIndex = 1;
  static MIN_LENGTH = 20;
  static type = 'line';

  strokeWidth = 2;

  constructor(scene, x1, y1, x2, y2, lineWidth = 10) {
    super(scene, x1, y1);

    this.length = this.width = 1;
    this.size = this.height = lineWidth;

    this.x1 = x1;
    this.y1 = y1;

    this.setEnd(x2, y2);
  }

  get cosX() {
    return Math.cos(this.rotation) * this.length;
  }

  get cosY() {
    return Math.sin(this.rotation) * this.length;
  }

  // this only works before calling enablePhysics
  recalculateGeom() {
    const { x1, y1, x2, y2 } = this;

    this.length = this.width = Math.max(
      1,
      Phaser.Math.Distance.Between(x1, y1, x2, y2),
    );

    this.setRotation(Phaser.Math.Angle.Between(x1, y1, x2, y2));

    this.x = (x1 + x2) / 2;
    this.y = (y1 + y2) / 2;
  }

  recomputeEnds() {
    const cx = this.cosX / 2,
      cy = this.cosY / 2;

    this.x1 = this.x - cx;
    this.y1 = this.y - cy;
    this.x2 = this.x + cx;
    this.y2 = this.y + cy;
  }

  setStart(x1, y1) {
    this.x1 = x1;
    this.y1 = y1;

    this.recalculateGeom();
  }

  setEnd(x2, y2) {
    this.x2 = x2;
    this.y2 = y2;

    this.recalculateGeom();
  }

  render() {
    this.gfx.fillStyle(this.fillColor);
    this.gfx.lineStyle(this.strokeWidth, this.strokeColor, 1);
    this.gfx.fillRect(-this.length / 2, -this.size / 2, this.length, this.size);
    this.gfx.strokeRect(
      -this.length / 2,
      -this.size / 2,
      this.length,
      this.size,
    );
  }

  toJSON() {
    this.recomputeEnds();

    return {
      type: this.constructor.type,
      x1: this.x1,
      y1: this.y1,
      x2: this.x2,
      y2: this.y2,
      size: this.size,
    };
  }

  static fromJSON(scene, { x1, y1, x2, y2, size }) {
    return new this(scene, x1, y1, x2, y2, size);
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

  get physicsOptions() {
    return {
      density: config.line.density,
    };
  }

  get geom() {
    // need to recalculate x1,y1,etc. when gameObject moves
    this.recomputeEnds();

    return new Phaser.Geom.Line(this.x1, this.y1, this.x2, this.y2);
  }

  *anchors() {
    // need to recalculate x1,y1,etc. when gameObject moves
    this.recomputeEnds();

    yield { x: this.x1, y: this.y1, id: 0 };
    yield { x: this.x2, y: this.y2, id: 1 };
  }
}
