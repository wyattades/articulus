import Phaser from 'phaser';

import { valuesIterator } from 'lib/utils';
import { Matter } from 'lib/physics';
import { config } from 'src/const';

import Part from './Part';

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
  width = 20 * config.gameScale;
  height = 40 * config.gameScale;

  thrustDir = 0;
  thrustForce = config.thruster.thrustForce;

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
      alpha: { min: 0.5, max: 0.8 },
      // blendMode: 'ADD',

      on: false,
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
      -this.width / 2 - 6 * config.gameScale,
      this.height / 2,
      this.width + 12 * config.gameScale,
      10 * config.gameScale,
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
    const norm = Matter.Vector.create(Math.cos(a), Math.sin(a));

    Matter.Body.applyForce(
      this.body,
      Matter.Vector.add(this.body.position, Matter.Vector.mult(norm, 20)),
      Matter.Vector.mult(norm, this.thrustForce),
    );
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

    yield { x: this.x, y: this.y, id: i++ };

    const a = this.rotation + Math.PI / 2;
    const offset = 20 * config.gameScale;
    const sx = Math.cos(a) * offset;
    const sy = Math.sin(a) * offset;

    yield { x: this.x + sx, y: this.y + sy, id: i++ };

    // yield { x: this.x + cx, y: this.y - cy, id: 0 };
    // yield { x: this.x - cx, y: this.y + cy, id: 1 };
  }
}
