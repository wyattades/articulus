import Phaser from 'phaser';

import { config } from 'src/const';
import { factoryMapNumber } from 'src/lib/utils';

import Part from './Part';

const getEllipsePoints = (w, h, numPoints) => {
  const a = w / 2,
    b = h / 2;

  const points = [];

  let delta = (2 * Math.PI) / numPoints;
  for (let angle = 0; angle < Math.PI * 2; angle += delta) {
    const x = a * Math.cos(angle);
    const y = b * Math.sin(angle);

    points.push({ x, y });
  }

  return points;
};

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

  static type = 'rect';

  setSize(width, height) {
    this.width = width;
    this.height = height;
  }

  render() {
    this.gfx.fillStyle(this.fillColor, this.fillOpacity);
    this.gfx.lineStyle(this.strokeWidth, this.strokeColor, this.strokeOpacity);
    this.gfx.fillRect(
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height,
    );
    this.gfx.strokeRect(
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height,
    );
  }

  get geom() {
    return new Phaser.Geom.Rectangle(
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height,
    );
  }

  /** @type {Phaser.Types.Physics.Matter.MatterBodyConfig | null} */
  get physicsOptions() {
    return {
      density: config.physics.landDensity,
      isStatic: true,
    };
  }

  get physicsShape() {
    return 'rectangle';
  }

  enablePhysics() {
    this.scene.matter.add.gameObject(this, {
      shape: this.physicsShape,
      angle: this.rotation,
      ...(this.physicsOptions || {}),
    });

    return this;
  }
}

export class Ellipse extends Rectangle {
  static type = 'ellipse';

  render() {
    this.gfx.fillStyle(this.fillColor, this.fillOpacity);
    this.gfx.lineStyle(this.strokeWidth, this.strokeColor, this.strokeOpacity);
    this.gfx.fillEllipse(0, 0, this.width, this.height);
    this.gfx.strokeEllipse(0, 0, this.width, this.height);
  }

  get geom() {
    return new Phaser.Geom.Ellipse(this.x, this.y, this.width, this.height);
  }

  get physicsShape() {
    if (this.width === this.height)
      return {
        type: 'circle',
        radius: this.width / 2,
      };

    return {
      type: 'fromVertices',
      verts: getEllipsePoints(this.width, this.height, 16),
    };
  }
}

export class Polygon extends Rectangle {
  static type = 'polygon';

  polygon = new Phaser.Geom.Polygon();

  getBounds(bounds) {
    bounds ||= new Phaser.Geom.Rectangle(0, 0, 1, 1);

    if (this.polygon.points.length === 0) {
      return bounds;
    }

    Phaser.Geom.Polygon.GetAABB(this.polygon, bounds);

    bounds.x += this.x;
    bounds.y += this.y;

    return bounds;
  }

  computeSize() {
    const b = this.getBounds();

    this.width = b.width;
    this.height = b.height;
  }

  mutateBounds(bounds, iBounds, iPoints) {
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

    for (let i = 0, len = iPoints.length; i < len; i++) {
      const p = this.polygon.points[i];
      const iP = iPoints[i];
      p.x = mapX(iP.x + iBounds.centerX) - bounds.centerX;
      p.y = mapY(iP.y + iBounds.centerY) - bounds.centerY;
    }

    super.mutateBounds(bounds);
  }

  get geom() {
    return new Phaser.Geom.Polygon(
      this.polygon.points.map((p) => ({
        x: p.x + this.x,
        y: p.y + this.y,
      })),
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
}

export const SHAPE_TYPE_CLASSES = [Rectangle, Ellipse].reduce((m, el) => {
  m[el.type] = el;
  return m;
}, {});
