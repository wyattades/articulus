import Phaser from 'phaser';

import { Matter } from '../lib/physics';
import Part from './Part';

function* circle4Points(radius, startRotation = 0) {
  const cos = Math.cos(startRotation) * radius;
  const sin = Math.sin(startRotation) * radius;

  yield [cos, sin];
  yield [sin, -cos];
  yield [-cos, -sin];
  yield [-sin, cos];
}

export default class Wheel extends Part {
  static type = 'wheel';
  static MAX_SPEED = 0.15;

  spinDir = 0;
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

    this.renderConnector(0, 0);
    for (const [dx, dy] of circle4Points(this.radius)) {
      this.renderConnector(dx, dy);
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

  intersects(rect) {
    const circleGeom = new Phaser.Geom.Circle(this.x, this.y, this.radius);
    return Phaser.Geom.Intersects.CircleToRectangle(circleGeom, rect);
  }

  enablePhysics() {
    super.enablePhysics();

    this.body.friction = 0.8;

    return this;
  }

  applyTorque = () => {
    this.body.torque = this.spinDir * this.appliedTorque;
  };

  capSpeed = () => {
    const vel = this.body.angularVelocity;
    if (Math.abs(vel) > Wheel.MAX_SPEED)
      Matter.Body.setAngularVelocity(
        this.body,
        Math.sign(vel) * Wheel.MAX_SPEED,
      );
  };

  onConnect({ x, y }) {
    if (
      this.spinDir !== 0 &&
      // this.x === x && this.y === y <-- this works too
      Phaser.Math.Distance.Power(x, y, this.x, this.y) <= 1
    ) {
      Matter.Events.on(
        this.scene.matter.world.engine,
        'beforeUpdate',
        this.applyTorque,
      );
      Matter.Events.on(
        this.scene.matter.world.engine,
        'afterUpdate',
        this.capSpeed,
      );
    }
  }

  onDisconnect({ x, y }) {
    if (Phaser.Math.Distance.Power(x, y, this.x, this.y) <= 1)
      this.stopSpinning();
  }

  stopSpinning() {
    Matter.Events.off(
      this.scene.matter.world.engine,
      'afterUpdate',
      this.capSpeed,
    );
    Matter.Events.off(
      this.scene.matter.world.engine,
      'beforeUpdate',
      this.applyTorque,
    );
  }

  destroy() {
    this.stopSpinning();
    super.destroy();
  }

  getHoverPoint(x, y, dist) {
    dist *= dist;

    if (Phaser.Math.Distance.Squared(x, y, this.x, this.y) < dist)
      return { x: this.x, y: this.y };

    for (const [dx, dy] of circle4Points(this.radius, this.rotation)) {
      const rx = this.x + dx;
      const ry = this.y + dy;
      if (Phaser.Math.Distance.Squared(x, y, rx, ry) < dist)
        return { x: rx, y: ry };
    }

    return null;
  }
}
