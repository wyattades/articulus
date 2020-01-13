export default class Tool {
  /**
   * @param {Phaser.Scene} scene
   * @param {string} toolKey
   */
  constructor(scene, toolKey) {
    this.scene = scene;
    this.toolKey = toolKey;
  }

  handlePointerMove(x, y) {}

  handlePointerUp(x, y) {}

  handlePointerDown(x, y) {}

  destroy() {}
}
