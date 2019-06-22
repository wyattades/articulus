import Part from '../objects/Part';

export default class Tool {
  /**
   * @param {Phaser.Scene} scene
   * @param {typeof Part} PartClass
   */
  constructor(scene, PartClass) {
    this.scene = scene;
    this.PartClass = PartClass;
  }

  render() {}

  handleMove(x, y) {}

  handlePointerUp(x, y) {}

  handlePointerDown(x, y) {}
}
