/* eslint-disable @typescript-eslint/no-unused-vars */
import { getHoveredJoint } from 'lib/physics';
import { EventManager } from 'src/lib/utils/eventManager';
import type { ObjectClass, Part } from 'src/objects';
import type { BaseScene } from 'src/scenes/Scene';

export default abstract class Tool {
  constructor(
    readonly scene: BaseScene,
    readonly toolKey: string,
  ) {}

  // drawObj is in PlaceTool
  drawObj: { obj: Part } | null = null;

  ShapeClass?: ObjectClass;

  private _eventManager?: EventManager;
  get eventManager() {
    return (this._eventManager ??= new EventManager());
  }

  refreshCursor(x: number, y: number) {
    const cursor = this.scene.cursor;
    if (!cursor) return null;

    const anchorJoint = getHoveredJoint(this.scene, x, y, this.drawObj?.obj);

    if (anchorJoint) {
      cursor.setPosition(anchorJoint.x, anchorJoint.y);
      cursor.setData('connectAnchorJoint', anchorJoint);
    } else {
      cursor.setData('connectAnchorJoint', null);
    }

    if (!!anchorJoint !== cursor.visible) cursor.setVisible(!!anchorJoint);

    return anchorJoint;
  }

  handlePointerMove(
    x: number,
    y: number,
    pointer: Phaser.Input.Pointer,
  ): boolean | void {}

  handlePointerUp(
    x: number,
    y: number,
    pointer: Phaser.Input.Pointer,
  ): boolean | void {}

  handlePointerDown(
    x: number,
    y: number,
    pointer: Phaser.Input.Pointer,
  ): boolean | void {}

  destroy() {
    this._eventManager?.off();
    this._eventManager = undefined;
  }
}
