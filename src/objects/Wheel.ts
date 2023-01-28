import Phaser from 'phaser';

import { Matter } from 'lib/physics';
import { circle4Points } from 'lib/utils';
import { config } from 'src/const';
import type { BaseScene } from 'src/scenes/Scene';

import Part from './Part';

export default class Wheel extends Part {
  static type = 'wheel';

  spinDir = 0;
  strokeWidth = 2;
  activeSpinDir = 0;

  radius: number;

  constructor(
    scene: BaseScene,
    x: number,
    y: number,
    radius = 30 * config.gameScale,
  ) {
    super(scene, x, y);

    this.radius = radius;
    this.width = this.height = radius * 2;
  }

  render() {
    const gfx = this.gfx!;
    gfx.lineStyle(this.strokeWidth, this.strokeColor);
    gfx.fillStyle(this.fillColor);
    gfx.fillCircle(0, 0, this.radius);
    gfx.strokeCircle(0, 0, this.radius);
  }

  // @ts-expect-error override method returntype
  toJSON() {
    return {
      type: this.klass.type,
      x: this.x,
      y: this.y,
      radius: this.radius,
      rotation: this.rotation,
    };
  }

  static fromJSON(
    scene: BaseScene,
    { x, y, radius, rotation }: ReturnType<typeof this.prototype.toJSON>,
  ) {
    const obj = new this(scene, x, y, radius);
    obj.rotation = rotation;
    return obj;
  }

  get physicsShape() {
    return {
      type: 'circle',
      x: this.x,
      y: this.y,
      radius: this.radius,
    };
  }

  // physics options:
  appliedTorque = config.wheel.appliedTorque;
  maxSpeed = config.wheel.maxSpeed;

  /** @type {Phaser.Types.Physics.Matter.MatterBodyConfig | null} */
  get physicsOptions() {
    return {
      density: config.wheel.density,
      friction: config.wheel.friction,
    };
  }

  get geom() {
    return new Phaser.Geom.Circle(this.x, this.y, this.radius);
  }

  applyTorque = () => {
    this.body!.torque = this.spinDir * this.appliedTorque;
  };

  capSpeed = () => {
    const vel = this.body!.angularVelocity;
    if (Math.abs(vel) > this.maxSpeed)
      Matter.Body.setAngularVelocity(
        this.body!,
        Math.sign(vel) * this.maxSpeed,
      );
  };

  onConnect(anchorId: number) {
    if (
      this.spinDir !== 0 &&
      anchorId === 0 &&
      this.activeSpinDir !== this.spinDir
    ) {
      this.stopSpinning();

      this.activeSpinDir = this.spinDir;
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

  onDisconnect(anchorId: number) {
    if (anchorId === 0 && this.getConnectedObjects(0).length === 0) {
      this.stopSpinning();
    }
  }

  stopSpinning() {
    this.activeSpinDir = 0;

    // TODO: this shouldn't be necessary,
    // but destroy() is being called when this.scene is undefined :/
    if (!this.scene) return;

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

  *anchors() {
    let i = 0;

    yield { x: this.x, y: this.y, id: i++ };

    for (const [dx, dy] of circle4Points(this.radius, this.rotation))
      yield { x: this.x + dx, y: this.y + dy, id: i++ };
  }
}
