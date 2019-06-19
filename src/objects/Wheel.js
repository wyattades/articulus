import Phaser from 'phaser';

import { Matter } from '../lib/physics';
import Part from './Part';

export default class Wheel extends Part {
  type = 'wheel';
  spinDir = 1;
  fillColor = 0xfff000;

  constructor(scene, x, y, radius = 30) {
    super(scene, x, y);

    this.radius = radius;

    this.fillStyle(this.fillColor);
    this.fillCircle(0, 0, radius);
    this.lineStyle(1, 0xff0000);
    this.lineBetween(0, 0, radius, 0);
  }

  enablePhysics(isStatic = false) {
    this.scene.matter.add.gameObject(this, {
      shape: {
        type: 'circle',
        x: this.x,
        y: this.y,
        radius: this.radius,
      },
      isStatic,
    });

    this.body.friction = 0.7;

    Matter.Events.on(
      this.scene.matter.world.engine,
      'beforeUpdate',
      this.applyTorque,
    );
  }

  applyTorque = () => {
    this.body.torque = this.spinDir * 0.1;
  };

  destroy() {
    Matter.Events.off(
      this.scene.matter.world.engine,
      'beforeUpdate',
      this.applyTorque,
    );
    super.destroy();
  }

  // getHoverPoint(x, y, dist) {
  //   if (Phaser.Math.Distance.Between(x, y, this.x, this.y) < dist)
  //     return { x: this.x, y: this.y };
  //   return null;
  // }
}
