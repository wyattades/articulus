import Phaser from 'phaser';

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
      density: 0.1,
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

export const SHAPE_TYPE_CLASSES = {
  rect: Rectangle,
  ellipse: Ellipse,
};
