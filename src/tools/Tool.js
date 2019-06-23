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

  handleMove(x, y) {}

  handlePointerUp(x, y) {}

  handlePointerDown(x, y) {}

  destroy() {}

  getHovered(x, y, ignore = null) {
    for (const child of this.scene.parts.getChildren()) {
      // if (ignore.includes(child)) continue;
      if (ignore && ignore(child)) continue;

      const jointPoint = child.getHoverPoint(x, y, 10);
      if (jointPoint) {
        return { x: jointPoint.x, y: jointPoint.y, obj: child };
      }
    }
    return null;
  }
}
