import Phaser from 'phaser';

import { Matter } from '../lib/physics';
import Part from './Part';

export default class Wheel extends Part {
  type = 'wheel';
  spinDir = 1;
  appliedTorque = 0.1;

  constructor(scene, x, y, radius = 30) {
    super(scene, x, y);

    this.radius = radius;
  }

  render() {
    this.lineStyle(2, this.strokeColor);
    this.fillStyle(this.fillColor);
    this.fillCircle(0, 0, this.radius);
    this.strokeCircle(0, 0, this.radius);

    this.connector(0, 0);
    for (let rot = 0; rot < Math.PI * 2; rot += Math.PI / 2) {
      const rx = Math.cos(rot) * this.radius;
      const ry = Math.sin(rot) * this.radius;
      this.connector(rx, ry);
    }
  }

  get physicsShape() {
    return {
      type: 'circle',
      x: this.x,
      y: this.y,
      radius: this.radius,
    };
  }

  collides(rect) {
    const circleGeom = new Phaser.Geom.Circle(this.x, this.y, this.radius);
    return Phaser.Geom.Intersects.CircleToRectangle(circleGeom, rect);
  }

  enablePhysics() {
    super.enablePhysics();

    this.body.friction = 0.7;

    Matter.Events.on(
      this.scene.matter.world.engine,
      'beforeUpdate',
      this.applyTorque,
    );

    return this;
  }

  applyTorque = () => {
    this.body.torque = this.spinDir * this.appliedTorque;
  };

  destroy() {
    Matter.Events.off(
      this.scene.matter.world.engine,
      'beforeUpdate',
      this.applyTorque,
    );
    super.destroy();
  }

  getHoverPoint(x, y, dist) {
    dist *= dist;

    if (Phaser.Math.Distance.Squared(x, y, this.x, this.y) < dist)
      return { x: this.x, y: this.y };

    for (
      let rot = this.rotation;
      rot < this.rotation + Math.PI * 2;
      rot += Math.PI / 2
    ) {
      const rx = this.x + Math.cos(rot) * this.radius;
      const ry = this.y + Math.sin(rot) * this.radius;
      if (Phaser.Math.Distance.Squared(x, y, rx, ry) < dist)
        return { x: rx, y: ry };
    }

    return null;
  }
}
