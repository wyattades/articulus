import type { Part } from 'src/objects';

export class BaseScene extends Phaser.Scene {
  shutdown() {}

  parts: Phaser.GameObjects.Group;

  debugShapes?: Record<
    string,
    Phaser.GameObjects.Rectangle | Phaser.GameObjects.Arc
  >;

  getParts() {
    return this.parts.getChildren() as unknown as Part[];
  }
}
