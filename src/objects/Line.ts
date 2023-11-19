import Phaser from 'phaser';

import { config } from 'src/const';
import type { BaseScene } from 'src/scenes/Scene';

import Part from './Part';

export default class Line extends Part {
  static zIndex = 1;
  static MIN_LENGTH = 20 * config.gameScale;
  static type = 'line';

  strokeWidth = 2;

  length: number;
  size: number;
  x1: number;
  y1: number;
  x2!: number;
  y2!: number;

  constructor(
    scene: BaseScene,
    x1 = 0,
    y1 = 0,
    x2 = x1,
    y2 = y1,
    lineWidth = 10 * config.gameScale,
  ) {
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

  setStart(x1: number, y1: number) {
    this.x1 = x1;
    this.y1 = y1;

    this.recalculateGeom();
  }

  setEnd(x2: number, y2: number) {
    this.x2 = x2;
    this.y2 = y2;

    this.recalculateGeom();
  }

  render() {
    const gfx = this.gfx!;
    gfx.fillStyle(this.fillColor);
    gfx.lineStyle(this.strokeWidth, this.strokeColor, 1);
    gfx.fillRect(-this.length / 2, -this.size / 2, this.length, this.size);
    gfx.strokeRect(-this.length / 2, -this.size / 2, this.length, this.size);
  }

  toSaveJSON() {
    this.recomputeEnds();

    return {
      type: this.klass.type,
      x1: this.x1,
      y1: this.y1,
      x2: this.x2,
      y2: this.y2,
      size: this.size,
    };
  }

  static fromJSON(
    scene: BaseScene,
    { x1, y1, x2, y2, size }: ReturnType<typeof this.prototype.toSaveJSON>,
  ) {
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
