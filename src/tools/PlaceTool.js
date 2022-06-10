import { stiffConnect } from 'lib/physics';
import { Wheel } from 'src/objects';
import { intersectsOtherSolid } from 'lib/utils';

import Tool from './Tool';

export default class PlaceTool extends Tool {
  /** @type {{ obj: FC.GameObject, startAnchorJoint?: FC.AnchorJoint }} */
  drawObj = null;

  // Overridden by LineTool
  canPlaceObject(drawObj) {
    const cursor = this.scene.cursor;

    const anchorJoint = cursor?.visible && cursor.getData('connectAnchorJoint');

    if (anchorJoint) {
      if (anchorJoint.obj) {
        if (anchorJoint.obj instanceof Wheel) return false;
      } else if (
        anchorJoint.joint &&
        Object.values(anchorJoint.joint.bodies).find(
          ([, body]) => body.gameObject instanceof Wheel,
        )
      )
        return false;
    } else if (intersectsOtherSolid(this.scene, drawObj.obj)) return false;

    return true;
  }

  *getConnections(_drawObj) {
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

  handlePointerDown(x, y) {
    const objExisted = this.activateObject(true);
    const cursor = this.scene.cursor;

    if (!objExisted) {
      if (cursor?.visible) {
        x = cursor.x;
        y = cursor.y;
      }

      const obj = new this.ShapeClass(this.scene, x, y);
      this.drawObj = { obj };
      obj.saveRender();

      const anchorJoint =
        cursor?.visible && cursor.getData('connectAnchorJoint');
      if (anchorJoint) {
        this.drawObj.startAnchorJoint = anchorJoint;
      }
    }
  }

  handleObjDrag(x, y) {
    this.drawObj.obj.setPosition(x, y);
  }

  handlePointerMove(x, y) {
    const anchorJoint = this.refreshCursor(x, y);
    if (this.drawObj) {
      if (anchorJoint) {
        x = anchorJoint.x;
        y = anchorJoint.y;
      }
      this.handleObjDrag(x, y);
    }
  }

  handlePointerUp(x, y) {
    if (this.activateObject()) this.refreshCursor(x, y);
  }
}
