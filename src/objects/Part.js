import Phaser from 'phaser';

import { adjustBrightness, nextId } from '../lib/utils';
import { deleteConnections } from '../lib/physics';

export default class Part extends Phaser.GameObjects.Graphics {
  static CONNECTOR_RADIUS = 6;
  static zIndex = 0;

  fillColor = 0xffffff;
  strokeColor = 0xffffff;
  strokeWidth = 0;
  id = nextId();

  constructor(scene, x, y) {
    super(scene, { x, y });
    scene.add.existing(this);
    if (this.constructor.zIndex !== 0) this.setDepth(this.constructor.zIndex);
  }

  /** @type {FC.Body} */
  body;

  static type = 'base_part';

  set color(color) {
    this.fillColor = color;
    this.strokeColor = this.iStrokeColor = adjustBrightness(color, -70);
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
    if (this.body) {
      console.warn(
        "Shouldn't call enablePhysics again!",
        this.id,
        this.body.id,
      );
      // deleteConnections(this.scene, this.body);
      // this.scene.matter.world.remove(this.body);
    }

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

  clone() {
    return this.constructor.fromJSON(this.scene, this.toJSON());
  }

  toJSON() {
    return {
      type: this.constructor.type,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      rotation: this.rotation,
    };
  }

  static fromJSON(scene, { type: _, x, y, ...rest }) {
    const obj = new this(scene, x, y);

    for (const k in rest) {
      obj[k] = rest[k];
    }

    return obj;
  }

  *anchors() {
    yield { x: this.x, y: this.y, id: 0 };
  }

  getAnchorById(id) {
    let i = 0;
    for (const anchor of this.anchors()) if (i++ === id) return anchor;

    console.warn('Invalid anchorId', id, this.constructor.type);
    return null;
  }

  getHoveredAnchor(x, y, dist) {
    dist *= dist;

    for (const anchor of this.anchors())
      if (Phaser.Math.Distance.Squared(x, y, anchor.x, anchor.y) < dist)
        return anchor;

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
