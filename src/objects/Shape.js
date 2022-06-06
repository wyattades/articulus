import Phaser from 'phaser';

import { Matter } from 'lib/physics';
import { config } from 'src/const';
import { factoryRotateAround, getEllipsePoints } from 'lib/utils';

import Part from './Part';

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
    const rotation = this.rotation;

    this.scene.matter.add.gameObject(this, {
      shape: this.physicsShape,
      ...(this.physicsOptions || {}),
    });

    // Get offset of center of mass and set the body to its correct position
    // https://github.com/liabru/matter-js/issues/211#issuecomment-184804576
    const centerOfMass = Matter.Vector.sub(
      Matter.Vector.mult(
        Matter.Vector.add(this.body.bounds.max, this.body.bounds.min),
        0.5,
      ),
      this.body.position,
    );
    const fix = centerOfMass;
    Matter.Body.setCentre(this.body, fix, true);
    this.setPosition(this.x - fix.x, this.y - fix.y);

    this.setRotation(rotation);

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
    if (!this.rotation || this.width === this.height) {
      return new Phaser.Geom.Ellipse(this.x, this.y, this.width, this.height);
    } else {
      return new Phaser.Geom.Polygon(
        getEllipsePoints(
          this.x,
          this.y,
          this.width,
          this.height,
          this.rotation,
          16,
        ),
      );
    }
  }

  get physicsShape() {
    if (this.width === this.height)
      return {
        type: 'circle',
        radius: this.width / 2,
      };

    return {
      type: 'fromVertices',
      verts: getEllipsePoints(0, 0, this.width, this.height),
    };
  }
}
