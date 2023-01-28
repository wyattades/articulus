import Phaser from 'phaser';

import { factoryMapNumber } from 'lib/utils';
import type { BaseScene } from 'src/scenes/Scene';

import { Shape } from './Shape';

export class Polygon extends Shape {
  static type = 'polygon';

  polygon: Phaser.Geom.Polygon;

  constructor(
    scene: BaseScene,
    x: number,
    y: number,
    polygon = new Phaser.Geom.Polygon(),
  ) {
    super(scene, x, y);

    // points relative to this.x, this.y, and this.rotation.
    // (this.x, this.y) is the center of this polygon
    this.polygon = polygon;
  }

  textureKey() {
    return `texture:${this.klass.type}:${Phaser.Geom.Polygon.GetNumberArray(
      this.polygon,
    ).join(' ')}:${this._selected ? 1 : 0}`;
  }

  getBounds(bounds?: Phaser.Geom.Rectangle) {
    bounds = bounds || (this._bounds ||= new Phaser.Geom.Rectangle());

    if (this.polygon.points.length === 0) {
      return bounds.setTo(this.x, this.y, 1, 1);
    }

    Phaser.Geom.Polygon.GetAABB(this.polygon, bounds);

    bounds.x += this.x;
    bounds.y += this.y;

    return bounds;
  }

  localizePoints() {
    const bounds = Phaser.Geom.Polygon.GetAABB(this.polygon);

    for (const p of this.polygon.points) {
      p.x -= bounds.centerX;
      p.y -= bounds.centerY;
    }

    this.setPosition(bounds.centerX, bounds.centerY);
    this.setSize(bounds.width, bounds.height);
  }

  mutateBounds(
    bounds: Phaser.Geom.Rectangle,
    iBounds: Phaser.Geom.Rectangle,
    iPoints?: Point[],
    // _deltaRotation: number,
  ) {
    if (!iPoints)
      throw new Error('iPoints is required in Polygon.mutateBounds');

    const mapX = factoryMapNumber(
      iBounds.x,
      iBounds.right,
      bounds.x,
      bounds.right,
    );
    const mapY = factoryMapNumber(
      iBounds.y,
      iBounds.bottom,
      bounds.y,
      bounds.bottom,
    );

    const from = {
      x: iBounds.centerX,
      y: iBounds.centerY,
    };

    // handle floating point errors
    // if (!deltaRotation || Math.abs(deltaRotation) < 0.0001) deltaRotation = 0;

    // let rotateAround;
    // if (deltaRotation !== 0) {
    //   rotateAround = factoryRotateAround(from, -deltaRotation);
    // }

    for (let i = 0, len = iPoints.length; i < len; i++) {
      const p = this.polygon.points[i];
      const iP = iPoints[i];
      // const delta = {
      //   x: iP.x,
      //   y: iP.y,
      // };
      // rotateAround?.(delta);
      p.x = mapX(from.x + iP.x);
      p.y = mapY(from.y + iP.y);
    }

    this.localizePoints();
  }

  get geom() {
    return new Phaser.Geom.Polygon(
      this.polygon.points.map((p) => {
        const r = this.rotation
          ? Phaser.Math.Rotate({ x: p.x, y: p.y }, this.rotation)
          : p;
        return {
          x: r.x + this.x,
          y: r.y + this.y,
        };
      }),
    );
  }

  get physicsShape() {
    return {
      type: 'fromVertices',
      verts: this.polygon.points.map((p) => ({ x: p.x, y: p.y })),
    };
  }

  render() {
    const gfx = this.gfx!;
    gfx.fillStyle(this.fillColor, this.fillOpacity);
    gfx.lineStyle(this.strokeWidth, this.strokeColor, this.strokeOpacity);

    gfx.beginPath();
    const points = this.polygon.points;
    gfx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      gfx.lineTo(points[i].x, points[i].y);
    }
    gfx.closePath();
    gfx.fillPath();
    gfx.strokePath();
  }

  // @ts-expect-error override method returntype
  toJSON() {
    return {
      type: this.klass.type,
      x: this.x,
      y: this.y,
      rotation: this.rotation,
      points: Phaser.Geom.Polygon.GetNumberArray(this.polygon),
    };
  }

  static fromJSON(
    scene: BaseScene,
    {
      type: _t,
      x,
      y,
      points,
      ...rest
    }: ReturnType<typeof this.prototype.toJSON>,
  ) {
    const obj = new this(scene, x, y);

    obj.polygon = new Phaser.Geom.Polygon(points);

    for (const k in rest) {
      obj[k as keyof typeof rest] = rest[k as keyof typeof rest];
    }

    const bounds = Phaser.Geom.Polygon.GetAABB(obj.polygon);
    obj.setSize(bounds.width, bounds.height);

    return obj;
  }
}
