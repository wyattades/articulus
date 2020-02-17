import Phaser from 'phaser';

import { adjustBrightness } from '../lib/utils';
import { deleteConnections } from '../lib/physics';

export default class Part extends Phaser.GameObjects.Graphics {
  static CONNECTOR_RADIUS = 6;

  fillColor = 0xffffff;
  strokeColor = 0xffffff;
  strokeWidth = 0;

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

  clone() {
    const newObj = new this.constructor(this.scene, this.x, this.y);
    newObj.setSize(this.width, this.height);
    // TODO: copy color and stuff

    return newObj;
  }

  getBounds(bounds) {
    bounds = bounds || new Phaser.Geom.Rectangle();

    bounds.setTo(
      this.x - (this.originX != null ? this.originX : 0.5) * this.width,
      this.y - (this.originY != null ? this.originY : 0.5) * this.height,
      this.width || 1,
      this.height || 1,
    );

    return bounds;
  }

  // setFromBounds({ x, y, width, height }) {
  //   this.setPosition(
  //     x + (this.originX != null ? this.originX : 0.5) * width,
  //     y + (this.originY != null ? this.originY : 0.5) * height,
  //   );
  //   this.width = width;
  //   this.height = height;
  // }

  // setOriginPosition(x, y) {
  //   this.setPosition(
  //     x + (this.originX != null ? this.originX : 0.5) * this.width,
  //     y + (this.originY != null ? this.originY : 0.5) * this.height,
  //   );
  // }

  renderConnector(x, y) {
    this.lineStyle(1, 0xffffff);
    this.fillStyle(0xcccccc, 1);
    this.fillCircle(x, y, Part.CONNECTOR_RADIUS);
    this.strokeCircle(x, y, Part.CONNECTOR_RADIUS);
  }

  render() {}

  _selected = false;
  setHighlight(isSelected) {
    isSelected = !!isSelected;
    if (this._selected === isSelected) return;
    this._selected = isSelected;

    if (isSelected) this.strokeWidth += 2;
    else this.strokeWidth -= 2;

    this.clear();
    this.render();
  }

  get physicsShape() {
    return {};
  }

  get physicsOptions() {
    return null;
  }

  get geom() {
    return new Phaser.Geom.Circle(this.x, this.y, Part.CONNECTOR_RADIUS);
  }

  enablePhysics() {
    this.scene.matter.add.gameObject(this, {
      ...(this.physicsOptions || {}),
      shape: this.physicsShape,
      angle: this.rotation,
    });

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
    if (this.body) {
      deleteConnections(this.scene, this.body);
      this.scene.matter.world.remove(this.body);
    }

    const scene = this.scene;
    super.destroy();

    if (scene && scene.followingPart === this) scene.refreshCameraFollower?.();
  }
}
