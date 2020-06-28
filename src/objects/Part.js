import Phaser from 'phaser';

import { adjustBrightness, nextId, setNextId } from '../lib/utils';
import { deleteConnections } from '../lib/physics';

const buffer = 20;

export default class Part extends Phaser.GameObjects.Sprite {
  static CONNECTOR_RADIUS = 6;
  static zIndex = 0;

  fillColor = 0xffffff;
  strokeColor = 0xffffff;
  strokeWidth = 0;

  constructor(scene, x, y) {
    super(scene, x, y);
    scene.add.existing(this);

    if (this.constructor.zIndex !== 0) this.setDepth(this.constructor.zIndex);
  }

  /** @type {FC.Body} */
  body;

  static type = 'base_part';

  _id = nextId();
  set id(val) {
    this._id = val;
    setNextId(val + 1);
  }
  get id() {
    return this._id;
  }

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
    this.gfx.lineStyle(1, 0xffffff);
    this.gfx.fillStyle(0xcccccc, 1);
    this.gfx.fillCircle(x, y, Part.CONNECTOR_RADIUS);
    this.gfx.strokeCircle(x, y, Part.CONNECTOR_RADIUS);
  }

  render() {}

  textureKey() {
    return `texture:${this.constructor.type}:${this.width}:${this.height}:${
      this._selected ? 1 : 0
    }`;
  }

  rerender() {
    if (this.texture.key !== '__DEFAULT') {
      this.setTexture();
    }

    if (this.gfx) {
      this.gfx.clear();
    } else {
      this.gfx = new Phaser.GameObjects.Graphics(this.scene).setActive(false);
      this.scene.add.existing(this.gfx);
    }

    this.render();

    this.gfx.setPosition(this.x, this.y);
    if (this.rotation != null) this.gfx.setRotation(this.rotation);
  }

  saveRender() {
    const w = this.width,
      h = this.height;

    if (!w || !h) return;

    const key = this.textureKey();

    const displayWh = w / 2 + buffer;
    const displayHh = h / 2 + buffer;

    if (this.gfx) this.gfx.destroy();

    if (!(key in this.scene.sys.textures.list)) {
      this.gfx = new Phaser.GameObjects.Graphics(this.scene);

      this.gfx.translateCanvas(displayWh, displayHh);
      this.render();
      this.gfx.generateTexture(key, displayWh * 2, displayHh * 2);

      this.gfx.destroy();
      this.gfx = null;
    }

    this.texture = this.scene.sys.textures.get(key);
    this.setFrame(0, false, false);

    this.setDisplayOrigin(displayWh, displayHh);
  }

  _selected = false;
  setHighlight(isSelected) {
    isSelected = !!isSelected;
    if (this._selected === isSelected) return;
    this._selected = isSelected;

    if (isSelected) this.strokeWidth += 2;
    else this.strokeWidth -= 2;

    this.saveRender();
  }

  get physicsShape() {
    return {};
  }

  /** @type {Phaser.Types.Physics.Matter.MatterBodyConfig | null} */
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
    }

    // NOTE: this changes this.origin
    this.scene.matter.add.gameObject(this, {
      shape: this.physicsShape,
      angle: this.rotation,
      density: 0.001,
      ...(this.physicsOptions || {}),
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

    if (this.gfx) {
      this.gfx.destroy();
      this.gfx = null;
    }

    const scene = this.scene;
    super.destroy();

    if (scene && scene.followingPart === this) scene.refreshCameraFollower?.();
  }
}
