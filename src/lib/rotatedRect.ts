import Phaser from 'phaser';

export const ROTATED_RECT = 100; // 1 more than biggest Geom type

const oppPoint = (
  from: Point,
  originX: 0 | 1,
  originY: 0 | 1,
  rotation: number,
  w: number,
  h: number,
  oppX: boolean,
  oppY: boolean,
) => {
  const dx = !oppX ? 0 : originX === 1 ? -w : w;
  const dy = !oppY ? 0 : originY === 1 ? -h : h;
  return Phaser.Math.RotateAround(
    { x: from.x + dx, y: from.y + dy },
    from.x,
    from.y,
    rotation,
  );
};

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

  static fromCorners(
    cornerA: Point,
    cornerB: Point,
    originX: 0 | 1,
    originY: 0 | 1,
    rotation: number,
  ) {
    // NOTE: This won't work for non-corner edgeObjs

    // center of rectangle
    const center = {
      x: (cornerB.x + cornerA.x) * 0.5,
      y: (cornerB.y + cornerA.y) * 0.5,
    };

    const a = Phaser.Math.RotateAround(
      { x: cornerB.x, y: cornerB.y },
      center.x,
      center.y,
      -rotation,
    );
    const b = Phaser.Math.RotateAround(
      { x: cornerA.x, y: cornerA.y },
      center.x,
      center.y,
      -rotation,
    );
    const newW = Math.abs(a.x - b.x);
    const newH = Math.abs(a.y - b.y);

    // top-left corner:
    const tl =
      originX === 1 && originY === 1
        ? cornerB
        : originX === 0 && originY === 0
        ? cornerA
        : originX === 1
        ? // opposite x, same y
          oppPoint(cornerA, originX, originY, rotation, newW, newH, true, false)
        : // same x, opposite y
          oppPoint(
            cornerA,
            originX,
            originY,
            rotation,
            newW,
            newH,
            false,
            true,
          );

    // this is the top-left corner of the UNROTATED rectangle
    const pos = Phaser.Math.RotateAround(
      { x: tl.x, y: tl.y },
      center.x,
      center.y,
      -rotation,
    );

    return new RotatedRect(pos.x, pos.y, newW, newH, rotation);
  }
}
