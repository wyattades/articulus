import Phaser from 'phaser';

import { factoryMapNumber } from 'lib/utils';

import { Rectangle } from './Shape';

export class Polygon extends Rectangle {
  static type = 'polygon';

  constructor(scene, x, y, polygon = new Phaser.Geom.Polygon()) {
    super(scene, x, y);

    // points relative to this.x, this.y, and this.rotation.
    // (this.x, this.y) is the center of this polygon
    this.polygon = polygon;
  }

  getBounds(bounds) {
    bounds ||= new Phaser.Geom.Rectangle();

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

  mutateBounds(bounds, iBounds, iPoints, _deltaRotation) {
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
    this.gfx.fillStyle(this.fillColor, this.fillOpacity);
    this.gfx.lineStyle(this.strokeWidth, this.strokeColor, this.strokeOpacity);

    this.gfx.beginPath();
    const points = this.polygon.points;
    this.gfx.moveTo(points[0].x, points[0].y);
    for (var i = 1; i < points.length; i++) {
      this.gfx.lineTo(points[i].x, points[i].y);
    }
    this.gfx.closePath();
    this.gfx.fillPath();
    this.gfx.strokePath();
  }

  toJSON() {
    return {
      type: this.constructor.type,
      x: this.x,
      y: this.y,
      rotation: this.rotation,
      points: Phaser.Geom.Polygon.GetNumberArray(this.polygon),
    };
  }

  static fromJSON(scene, { type: _t, x, y, points, ...rest }) {
    const obj = new this(scene, x, y);

    obj.polygon = new Phaser.Geom.Polygon(points);

    for (const k in rest) {
      obj[k] = rest[k];
    }

    const bounds = Phaser.Geom.Polygon.GetAABB(obj.polygon);
    obj.setSize(bounds.width, bounds.height);

    return obj;
  }
}
