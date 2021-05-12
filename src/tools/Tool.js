import { getHoveredJoint } from 'lib/physics';

export default class Tool {
  /**
   * @param {Phaser.Scene} scene
   * @param {string} toolKey
   */
  constructor(scene, toolKey) {
    this.scene = scene;
    this.toolKey = toolKey;
  }

  /**
   * @return {{ x: number, y: number, obj: import('../objects/Part').default } | null}
   */
  refreshCursor(x, y) {
    const cursor = this.scene.cursor;
    if (!cursor) return null;

    const anchorJoint = getHoveredJoint(
      this.scene,
      x,
      y,
      // drawObj is in PlaceTool
      this.drawObj?.obj || null,
    );

    if (anchorJoint) {
      cursor.setPosition(anchorJoint.x, anchorJoint.y);
      cursor.setData('connectAnchorJoint', anchorJoint);
    } else {
      cursor.setData('connectAnchorJoint', null);
    }

    if (!!anchorJoint !== cursor.visible) cursor.setVisible(!!anchorJoint);

    return anchorJoint;
  }

  handlePointerMove(x, y) {}

  handlePointerUp(x, y) {}

  handlePointerDown(x, y) {}

  destroy() {}
}
