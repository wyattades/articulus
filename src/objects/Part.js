import Phaser from 'phaser';

export default class Part extends Phaser.GameObjects.Graphics {
  constructor(scene, x, y) {
    super(scene, { x, y });
    scene.add.existing(this);
  }

  /**
   * @type Matter.Body
   */
  body;

  type = 'base_part';

  render() {}

  get physicsShape() {
    return {};
  }

  enablePhysics() {
    this.scene.matter.add.gameObject(this, {
      shape: this.physicsShape,
      angle: this.rotation,
    });
    const cf = this.body.collisionFilter;
    cf.connections = {};
    cf.id = this.body.id;
    
    return this;
  }

  getHoverPoint(x, y, dist) {
    dist *= dist;

    if (Phaser.Math.Distance.Squared(x, y, this.x, this.y) < dist)
      return { x: this.x, y: this.y };
    return null;
  }
}
