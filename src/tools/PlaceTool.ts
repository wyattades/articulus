import { stiffConnect } from 'lib/physics';
import { intersectsOtherSolid } from 'lib/utils/phaser';
import type { Part } from 'src/objects';
import { Wheel } from 'src/objects';

import Tool from './Tool';

export type DrawObj = {
  obj: Part; // Phaser.GameObjects.GameObject;
  startAnchorJoint?: FC.AnchorJoint;
};

export default class PlaceTool extends Tool {
  drawObj: DrawObj | null = null;

  // Overridden by LineTool
  canPlaceObject(drawObj: DrawObj) {
    const cursor = this.scene.cursor;

    const anchorJoint = cursor?.visible && cursor.getData('connectAnchorJoint');

    if (anchorJoint) {
      if (anchorJoint.obj) {
        if (anchorJoint.obj instanceof Wheel) return false;
      } else if (
        anchorJoint.joint &&
        Object.values(anchorJoint.joint.bodies).some(
          ([, body]) => body.gameObject instanceof Wheel,
        )
      )
        return false;
    } else if (
      intersectsOtherSolid(
        this.scene.parts.getChildren(),
        this.scene.terrainGroup?.getChildren(),
        drawObj.obj,
      )
    )
      return false;

    return true;
  }

  *getConnections(_drawObj: DrawObj): Generator<[FC.AnchorJoint, number]> {
    const cursor = this.scene.cursor;

    const anchorJoint = cursor?.visible && cursor.getData('connectAnchorJoint');

    if (anchorJoint) yield [anchorJoint, 0];
  }

  activateObject(destroy = false) {
    const drawObj = this.drawObj;
    if (drawObj) {
      this.drawObj = null;
      const { obj } = drawObj;

      if (destroy) obj.destroy();
      else {
        if (!this.canPlaceObject(drawObj) || this.scene.precheckMaxItems?.(1)) {
          obj.destroy();
          return drawObj;
        }

        obj.enablePhysics();
        obj.saveRender(); // must be after enablePhysics
        this.scene.parts.add(obj);

        for (const [anchorJoint, anchorId] of this.getConnections(drawObj)) {
          stiffConnect(this.scene, anchorJoint, obj, anchorId);
        }
      }

      drawObj.startAnchorJoint = undefined;
    }

    return drawObj;
  }

  handlePointerDown(x: number, y: number) {
    const objExisted = this.activateObject(true);
    const cursor = this.scene.cursor;

    if (!objExisted) {
      if (cursor?.visible) {
        x = cursor.x;
        y = cursor.y;
      }

      if (!this.ShapeClass) throw new Error('ShapeClass not set');
      const obj = new this.ShapeClass(this.scene, x, y) as Part;
      this.drawObj = { obj };
      obj.saveRender();

      const anchorJoint =
        cursor?.visible && cursor.getData('connectAnchorJoint');
      if (anchorJoint) {
        this.drawObj.startAnchorJoint = anchorJoint;
      }
    }
  }

  handleObjDrag(x: number, y: number) {
    this.drawObj?.obj.setPosition(x, y);
  }

  handlePointerMove(x: number, y: number) {
    const anchorJoint = this.refreshCursor(x, y);
    if (this.drawObj) {
      if (anchorJoint) {
        x = anchorJoint.x;
        y = anchorJoint.y;
      }
      this.handleObjDrag(x, y);
    }
  }

  handlePointerUp(x: number, y: number) {
    if (this.activateObject()) this.refreshCursor(x, y);
  }
}
