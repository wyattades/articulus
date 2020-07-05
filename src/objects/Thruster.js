import Phaser from 'phaser';

import Part from './Part';
import { circle4Points, valuesIterator } from '../lib/utils';
import { Matter } from '../lib/physics';

const anyNonemptyArrayValue = (objOfArrays) => {
  for (const val of valuesIterator(objOfArrays))
    if (val.length > 0) return true;
  return false;
};

// const genTexture = (key, render, gfx = null, force = false) => {
//   if (force || !this.scene.sys.textures.exists(key)) {
//     if (gfx) gfx.clear();
//     else gfx = new Phaser.GameObjects.Graphics(this.scene);
//     render(gfx);
//     gfx.destroy();
//   }
// };

export default class Thruster extends Part {
  static type = 'thruster';

  strokeWidth = 2;
  fillColor = 0xb1b5da;
  strokeColor = 0x5b668f;
  width = 20;
  height = 40;

  thrustDir = 0;
  thrustForce = 0.008;

  constructor(scene, x, y) {
    super(scene, x, y);

    const particleTextureKey = 'particles:cloud';
    if (!this.scene.sys.textures.exists(particleTextureKey)) {
      const gfx = new Phaser.GameObjects.Graphics(this.scene);
      gfx.fillStyle(0xffeeee);
      gfx.fillCircle(10, 10, 8);
      gfx.generateTexture(particleTextureKey, 20, 20);
      gfx.destroy();
    }

    const colors = [0xffffff, 0xeeeeee, 0xdddddd];

    this.emitter = this.addParticles(particleTextureKey, 0, {
      follow: this,
      x: {
        onEmit: () => Math.cos(this.rotation + Math.PI / 2) * 30,
      },
      y: {
        onEmit: () => Math.sin(this.rotation + Math.PI / 2) * 30,
      },

      lifespan: 800,
      speed: { min: 200, max: 600 },
      angle: {
        onEmit: () => this.angle + 90 + Phaser.Math.RND.between(-20, 20),
      },

      // gravityY: 300,
      scale: {
        start: 1.0,
        end: 0.0,
      },
      // quantity: 2,
      tint: { onEmit: () => Phaser.Utils.Array.GetRandom(colors) },
      // blendMode: 'ADD',
    }).emitters.first;
  }

  render() {
    this.gfx.lineStyle(this.strokeWidth, this.strokeColor);
    this.gfx.fillStyle(this.fillColor);

    this.gfx.fillRect(
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height,
    );
    this.gfx.strokeRect(
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height,
    );
    this.gfx.fillRect(
      -this.width / 2 - 6,
      this.height / 2,
      this.width + 12,
      10,
    );
  }

  toJSON() {
    return {
      type: this.constructor.type,
      x: this.x,
      y: this.y,
      rotation: this.rotation,
    };
  }

  static fromJSON(scene, { x, y, rotation }) {
    const obj = new this(scene, x, y);
    obj.rotation = rotation;
    return obj;
  }

  get physicsShape() {
    return 'rectangle';
  }

  /** @type {Phaser.Types.Physics.Matter.MatterBodyConfig | null} */
  get physicsOptions() {
    return {};
  }

  get geom() {
    return new Phaser.Geom.Rectangle(
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height,
    );
  }

  applyThrust = () => {
    const a = this.rotation - Math.PI / 2;

    const force = Matter.Vector.create(
      Math.cos(a) * this.thrustForce,
      Math.sin(a) * this.thrustForce,
    );

    Matter.Body.applyForce(this.body, this.body.position, force);
  };

  stopThrust() {
    // TODO: this shouldn't be necessary,
    // but destroy() is being called when this.scene is undefined :/
    if (!this.scene) return;

    this.thrustDir = 0;

    Matter.Events.off(
      this.scene.matter.world.engine,
      'beforeUpdate',
      this.applyThrust,
    );

    this.emitter.stop();
  }

  startThrust() {
    this.thrustDir = -1;

    Matter.Events.on(
      this.scene.matter.world.engine,
      'beforeUpdate',
      this.applyThrust,
    );

    this.emitter.start();
  }

  onConnect(_anchorId) {
    if (this.thrustDir === 0) {
      this.stopThrust();
      this.startThrust();
    }
  }

  onDisconnect(_anchorId) {
    if (
      this.thrustDir !== 0 &&
      !anyNonemptyArrayValue(this.getConnectedObjects())
    ) {
      this.stopThrust();
    }
  }

  destroy() {
    this.stopThrust();
    super.destroy();
  }

  *anchors() {
    let i = 0,
      j = 0;
    for (const [dx, dy] of circle4Points(10, this.rotation)) {
      if (j++ % 2 === 1) yield { x: this.x + dx, y: this.y + dy, id: i++ };
    }

    // yield { x: this.x + cx, y: this.y - cy, id: 0 };
    // yield { x: this.x - cx, y: this.y + cy, id: 1 };
  }
}
