import { getHoveredJoint } from 'lib/physics';
import type PlayScene from 'src/scenes/Play';
import type EditorScene from 'src/scenes/Editor';

export default class Tool {
  constructor(
    readonly scene: PlayScene | EditorScene,
    readonly toolKey: string,
  ) {}

  drawObj = null;

  refreshCursor(x: number, y: number) {
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

  handlePointerMove(x: number, y: number): boolean | void {}

  handlePointerUp(x: number, y: number): boolean | void {}

  handlePointerDown(x: number, y: number): boolean | void {}

  destroy() {}
}
