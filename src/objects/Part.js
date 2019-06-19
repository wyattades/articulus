import Phaser from 'phaser';

export default class Part extends Phaser.GameObjects.Graphics {
  constructor(scene, x, y) {
    super(scene, { x, y });
    scene.add.existing(this);
  }

  type = 'base_part';

  render() {}

  enablePhysics(isStatic = false) {}

  getHoverPoint(x, y, dist) {
    if (Phaser.Math.Distance.Between(x, y, this.x, this.y) < dist)
      return { x: this.x, y: this.y };
    return null;
  }
}
