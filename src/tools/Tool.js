import Part from '../objects/Part';
import { constrain } from '../lib/utils';

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
    const hoverDist = constrain(10 / this.scene.cameras.main.zoom, 6, 24);

    for (const child of this.scene.parts.getChildren()) {
      if (ignore && ignore(child)) continue;

      const jointPoint = child.getHoverPoint(x, y, hoverDist);
      if (jointPoint) {
        return { x: jointPoint.x, y: jointPoint.y, obj: child };
      }
    }
    return null;
  }
}