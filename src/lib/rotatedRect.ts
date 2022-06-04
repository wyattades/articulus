import Phaser from 'phaser';

export const ROTATED_RECT = 100;

export class RotatedRect extends Phaser.Geom.Rectangle {
  rotation: number;
  constructor(cx: number, cy: number, w: number, h: number, rotation: number) {
    super(cx, cy, w, h);
    this.rotation = rotation;
    // @ts-expect-error override `type`
    this.type = ROTATED_RECT;
  }

  borderPoint(dx: number, dy: number) {
    return Phaser.Math.RotateAround(
      { x: this.x + dx * (this.width / 2), y: this.y + dy * (this.height / 2) },
      this.x,
      this.y,
      this.rotation,
    );
  }

  get topLeft() {
    return this.borderPoint(-1, -1);
  }
}
