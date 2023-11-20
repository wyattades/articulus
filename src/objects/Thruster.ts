import Phaser from 'phaser';

import { Matter } from 'lib/physics';
import { valuesIterator } from 'lib/utils';
import { config } from 'src/const';
import type { BaseScene } from 'src/scenes/Scene';
import { COLORS } from 'src/styles/theme';

import Part from './Part';

const anyNonemptyArrayValue = (
  arrayOfArrays: (unknown[] | undefined)[],
): boolean => {
  for (const val of valuesIterator(arrayOfArrays))
    if (val && val.length > 0) return true;
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
  fillColor = COLORS.thrusterFill;
  strokeColor = COLORS.thrusterStroke;
  width = 20 * config.gameScale;
  height = 40 * config.gameScale;

  thrustDir = 0;
  thrustForce = config.thruster.thrustForce;

  emitter: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: BaseScene, x: number, y: number) {
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
      follow: this as unknown as Phaser.GameObjects.GameObject,
      x: {
        onEmit: () => Math.cos(this.rotation + Math.PI / 2) * 30,
      },
      y: {
        onEmit: () => Math.sin(this.rotation + Math.PI / 2) * 30,
      },

      lifespan: 800,
      speed: { min: 200, max: 600 },
      angle: {
        onEmit: () => this.angle + 90 + Phaser.Math.RND.realInRange(-15, 15),
      },

      // gravityY: 300,
      scale: {
        start: 1.0,
        end: 0.0,
      },
      // quantity: 2,
      tint: { onEmit: () => Phaser.Utils.Array.GetRandom(colors) as number },
      alpha: { min: 0.5, max: 0.8 },
      // blendMode: 'ADD',

      on: false,
    }).setDepth(-1).emitters.first;
  }

  render() {
    const gfx = this.gfx!;
    gfx.lineStyle(this.strokeWidth, this.strokeColor);
    gfx.fillStyle(this.fillColor);

    gfx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    gfx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
    gfx.fillRect(
      -this.width / 2 - 6 * config.gameScale,
      this.height / 2,
      this.width + 12 * config.gameScale,
      10 * config.gameScale,
    );
  }

  toSaveJSON() {
    return {
      type: this.klass.type,
      x: this.x,
      y: this.y,
      rotation: this.rotation,
    };
  }

  static fromJSON(
    scene: BaseScene,
    { x, y, rotation }: ReturnType<typeof this.prototype.toSaveJSON>,
  ) {
    const obj = new this(scene, x, y);
    obj.rotation = rotation;
    return obj;
  }

  get physicsShape() {
    return 'rectangle';
  }

  applyThrust = () => {
    const a = this.rotation - Math.PI / 2;
    const norm = Matter.Vector.create(Math.cos(a), Math.sin(a));

    Matter.Body.applyForce(
      this.body!,
      Matter.Vector.add(this.body!.position, Matter.Vector.mult(norm, 20)),
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

  onConnect() {
    if (this.thrustDir === 0) {
      this.stopThrust();
      this.startThrust();
    }
  }

  onDisconnect() {
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
    let i = 0;

    yield { x: this.x, y: this.y, id: i };
    i++; // NOTE: putting `i++` inline causes a syntax bug ("invalid increment/decrement operand")

    const a = this.rotation + Math.PI / 2;
    const offset = 20 * config.gameScale;
    const sx = Math.cos(a) * offset;
    const sy = Math.sin(a) * offset;

    yield { x: this.x + sx, y: this.y + sy, id: i };
    i++;

    // yield { x: this.x + cx, y: this.y - cy, id: 0 };
    // yield { x: this.x - cx, y: this.y + cy, id: 1 };
  }
}
