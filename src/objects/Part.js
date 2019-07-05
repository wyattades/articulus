import Phaser from 'phaser';

import { adjustBrightness } from '../lib/utils';

import { Matter, deleteConnections } from '../lib/physics';

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

  get physicsShape() {
    return {};
  }

  get physicsOptions() {
    return null;
  }

  get geom() {
    return new Phaser.Geom.Point(this.x, this.y);
  }

  enablePhysics() {
    this.scene.matter.add.gameObject(this, {
      shape: this.physicsShape,
      angle: this.rotation,
    });

    const opt = this.physicsOptions;
    if (opt) Matter.Body.set(this.body, opt);

    const cf = this.body.collisionFilter;
    cf.joints = {};
    cf.id = this.body.id;
    if (this.noCollide) cf.noCollide = true;

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

  destroy() {
    if (this.body) deleteConnections(this.scene, this.body);
    super.destroy();
  }
}
