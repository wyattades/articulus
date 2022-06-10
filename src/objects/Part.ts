import Phaser from 'phaser';

import {
  adjustBrightness,
  getBoundPoints,
  midpoint,
  nextId,
  setNextId,
  valuesIterator,
} from 'lib/utils';
import { deleteConnections, Matter } from 'lib/physics';
import { config, CONNECTOR_RADIUS } from 'src/const';
import type { BaseScene } from 'src/scenes/Scene';
import type { Geom } from 'src/lib/geom';

const texturePadding = 20 * config.gameScale;

// doesn't really matter which texture we render here
const DEFAULT_TEXTURE = '__DEFAULT';

export default abstract class Part extends Phaser.GameObjects.Sprite {
  static zIndex = 0;

  static type = 'base_part';

  fillColor = 0xffffff;
  strokeColor = 0xffffff;
  strokeWidth = 0;
  iStrokeColor?: number;

  particles: Phaser.GameObjects.Particles.ParticleEmitterManager[] | null =
    null;

  polygon?: Phaser.Geom.Polygon;

  noCollide = false;

  scene!: BaseScene;

  gfx: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: BaseScene, x: number, y: number) {
    super(scene, x, y, DEFAULT_TEXTURE);

    scene.add.existing(this as any);

    if (this.klass.zIndex !== 0) this.setDepth(this.klass.zIndex);
  }

  get klass() {
    return this.constructor as typeof Part;
  }

  // @ts-expect-error body CAN be undefined
  body?: FC.Body;

  _id = nextId();
  set id(val) {
    this._id = val;
    setNextId(val + 1);
  }
  get id() {
    return this._id;
  }

  set color(color: number) {
    this.fillColor = color;
    this.strokeColor = this.iStrokeColor = adjustBrightness(color, -70);
  }

  _bounds?: Phaser.Geom.Rectangle;
  // @ts-expect-error bad override
  getBounds(bounds?: Phaser.Geom.Rectangle) {
    bounds = bounds || (this._bounds ||= new Phaser.Geom.Rectangle());

    bounds.setTo(
      this.x - this.width * 0.5,
      this.y - this.height * 0.5,
      this.width || 1,
      this.height || 1,
    );

    return bounds;
  }

  renderConnectors() {
    const gfx = this.gfx!;
    gfx.lineStyle(1, 0xffffff);
    gfx.fillStyle(0xcccccc, 1);

    const p = { x: 0, y: 0 };
    for (const a of this.anchors()) {
      p.x = a.x - this.x;
      p.y = a.y - this.y;

      Phaser.Math.Rotate(p, -this.rotation);

      gfx.fillCircle(p.x, p.y, CONNECTOR_RADIUS);
      gfx.strokeCircle(p.x, p.y, CONNECTOR_RADIUS);
    }
  }

  render() {}

  mutateBounds(
    bounds: Phaser.Geom.Rectangle,
    _iBounds: Phaser.Geom.Rectangle,
    _iPoints?: Point[],
  ) {
    this.setPosition(bounds.centerX, bounds.centerY);
    this.setSize(bounds.width, bounds.height);
  }

  textureKey() {
    return `texture:${this.klass.type}:${this.width}:${this.height}:${
      this._selected ? 1 : 0
    }`;
  }

  rerender() {
    // clear any active texture
    if (this.texture.key !== DEFAULT_TEXTURE) {
      // this.texture.destroy(); TODO: clear up memory?

      const w = this.width,
        h = this.height;
      // this sets the dimensions to the size of the texture e.g. 32x32
      this.setTexture(DEFAULT_TEXTURE);
      // make sure dimensions aren't changed
      this.setSize(w, h);
    }

    if (this.gfx) {
      this.gfx.clear();
    } else {
      this.gfx = this.scene.add.graphics().setActive(false);
    }

    this.render();
    this.renderConnectors();

    this.gfx.setPosition(this.x, this.y);
    if (this.rotation != null) this.gfx.setRotation(this.rotation);
  }

  saveRender() {
    const w = this.width,
      h = this.height;

    if (!w || !h) return;

    const key = this.textureKey();

    const displayWh = w / 2 + texturePadding;
    const displayHh = h / 2 + texturePadding;

    if (this.gfx) this.gfx.destroy();

    if (!this.scene.sys.textures.exists(key)) {
      this.gfx = new Phaser.GameObjects.Graphics(this.scene);

      this.gfx.translateCanvas(displayWh, displayHh);
      this.render();
      this.renderConnectors();
      this.gfx.generateTexture(key, displayWh * 2, displayHh * 2);

      this.gfx.destroy();
      this.gfx = null;
    }

    this.texture = this.scene.sys.textures.get(key);

    this.setFrame(0, false, false);

    this.setDisplayOrigin(displayWh, displayHh);
  }

  _selected = false;
  setHighlight(isSelected: boolean) {
    isSelected = !!isSelected;
    if (this._selected === isSelected) return;
    this._selected = isSelected;

    if (isSelected) this.strokeWidth += 2;
    else this.strokeWidth -= 2;

    this.saveRender();
  }

  get geom(): Geom {
    const rect = new Phaser.Geom.Rectangle(
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height,
    );
    if (!this.rotation) {
      return rect;
    } else {
      return new Phaser.Geom.Polygon(getBoundPoints(rect, this.rotation));
    }
  }

  get physicsShape(): FC.PhysicsShape {
    return null;
  }

  get physicsOptions(): Phaser.Types.Physics.Matter.MatterBodyConfig | null {
    return null;
  }

  enablePhysics() {
    const physicsShape = this.physicsShape;
    if (!physicsShape) return this;

    if (this.body) {
      console.warn(
        'enablePhysics was called more than once:',
        this.id,
        this.body.id,
      );
    }

    const iRotation = this.rotation;

    // NOTE: this changes this.origin (I think)
    this.scene.matter.add.gameObject(this as any, {
      shape: physicsShape,
      ...(this.physicsOptions || {}),
    });

    const body = this.body!;

    // Get offset of center of mass and set the body to its correct position
    // https://github.com/liabru/matter-js/issues/211#issuecomment-184804576
    // (this is only strictly necessary on Polygon object b/c it's the only one of our shapes that can have a non-centered center-of-mass)
    const centerOfMass = Matter.Vector.sub(
      midpoint(body.bounds.max, body.bounds.min),
      body.position,
    );
    Matter.Body.setCentre(body, centerOfMass, true);
    this.setPosition(this.x - centerOfMass.x, this.y - centerOfMass.y);

    this.setRotation(iRotation);

    if (!body.isStatic) {
      const cf = body.collisionFilter;
      cf.joints = {};
      cf.id = body.id;
      if (this.noCollide) cf.noCollide = true;
    }

    return this;
  }

  clone() {
    return this.klass.fromJSON(this.scene, this.toJSON());
  }

  // @ts-expect-error bad override
  toJSON() {
    return {
      type: this.klass.type,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      rotation: this.rotation,
    };
  }

  static fromJSON(
    scene: BaseScene,
    { type: _t, x, y, ...rest }: ReturnType<Part['toJSON']>,
  ) {
    const Klass = this as any;

    const obj = new Klass(scene, x, y);

    Object.assign(obj, rest);

    return obj;
  }

  getConnectedObjects(anchorId = null, includeSelf = false) {
    const anchorObjs: FC.GameObject[][] | null =
      anchorId == null
        ? Array.from({ length: this.anchorCount }, () => [])
        : null;

    for (const joint of valuesIterator(this.body!.collisionFilter.joints)) {
      const aId = joint.bodies[this.body!.id]?.[0];
      if (aId == null || (anchorId != null && anchorId !== aId)) continue;

      const objs = Object.values(joint.bodies).map((r) => r[1].gameObject);

      if (!includeSelf) {
        const i = objs.indexOf(this as any);
        if (i >= 0) objs.splice(i, 1);
      }

      if (anchorId == null) {
        anchorObjs![aId] = objs;
      } else {
        return objs;
      }
    }

    return anchorObjs || [];
  }

  *anchors(): Generator<Point, void, unknown> {
    // empty
  }

  getAnchorById(id: number) {
    let i = 0;
    for (const anchor of this.anchors()) if (i++ === id) return anchor;

    console.warn('Invalid anchorId', id, this.klass.type);
    return null;
  }

  getHoveredAnchor(x: number, y: number, dist: number) {
    dist *= dist;

    for (const anchor of this.anchors())
      if (Phaser.Math.Distance.Squared(x, y, anchor.x, anchor.y) < dist)
        return anchor;

    return null;
  }

  _anchorCount?: number;
  get anchorCount() {
    if (this._anchorCount != null) return this._anchorCount;

    return (this._anchorCount = [...this.anchors()].length);
  }

  addParticles(
    texture: string,
    frame: number,
    emitters: MaybeArray<Phaser.Types.GameObjects.Particles.ParticleEmitterConfig>,
  ) {
    const p = this.scene.add.particles(texture, frame, emitters);
    if (!this.scene.running) p.pause();
    (this.particles ||= []).push(p);
    return p;
  }

  onConnect() {}

  onDisconnect() {}

  pause() {
    if (this.particles) for (const p of this.particles) p.pause();
  }
  resume() {
    if (this.particles) for (const p of this.particles) p.resume();
  }

  destroy() {
    if (this.body) {
      deleteConnections(this.scene, this.body);
      this.scene.matter.world.remove(this.body);
    }

    if (this.gfx) {
      this.gfx.destroy();
      this.gfx = null;
    }

    if (this.particles) {
      for (const p of this.particles) p.destroy();
      this.particles = null;
    }

    const scene = this.scene;
    super.destroy();

    // @ts-expect-error _follow is not typed?
    if (scene?.cameras?.main?._follow === this) scene.refreshCameraFollower?.();
  }
}
