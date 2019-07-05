import Phaser from 'phaser';

import { adjustBrightness } from '../lib/utils';

export default class Part extends Phaser.GameObjects.Graphics {
  static CONNECTOR_RADIUS = 6;

  fillColor = 0xffffff;
  strokeColor = 0xffffff;

  constructor(scene, x, y) {
    super(scene, { x, y });
    scene.add.existing(this);
  }

  /**
   * @type Matter.Body
   */
  body;

  static type = 'base_part';

  set color(color) {
    this.fillColor = color;
    this.strokeColor = this.iStrokeColor = adjustBrightness(color, -70);
  }

  renderConnector(x, y) {
    this.lineStyle(1, 0xffffff);
    this.fillStyle(0xcccccc, 1);
    this.fillCircle(x, y, Part.CONNECTOR_RADIUS);
    this.strokeCircle(x, y, Part.CONNECTOR_RADIUS);
  }

  render() {}

  /**
   * @param {Phaser.Geom.Rectangle} rect
   */
  intersects(rect) {
    return false;
  }

  // eslint-disable-next-line class-methods-use-this
  get physicsShape() {
    return {};
  }

  enablePhysics() {
    this.scene.matter.add.gameObject(this, {
      shape: this.physicsShape,
      angle: this.rotation,
    });

    // this.body.joints = {};

    const cf = this.body.collisionFilter;
    cf.joints = {};
    cf.id = this.body.id;

    return this;
  }

  getHoverPoint(x, y, dist) {
    dist *= dist;

    if (Phaser.Math.Distance.Squared(x, y, this.x, this.y) < dist)
      return { x: this.x, y: this.y };
    return null;
  }

  onConnect() {}

  onDisconnect() {}
}
