import { stiffConnect } from '../lib/physics';
import { Wheel, OBJECTS } from '../objects';
import Tool from './Tool';
import { intersectsOtherSolid } from '../lib/utils';

export default class PlaceTool extends Tool {
  /** @type {{ obj: FC.GameObject, startAnchorJoint?: FC.AnchorJoint }} */
  drawObj = null;

  // Overridden by LineTool
  canPlaceObject(drawObj) {
    const cursor = this.scene.cursor;

    const anchorJoint = cursor.getData('connectAnchorJoint');

    if (cursor.visible && anchorJoint) {
      if (anchorJoint.obj) {
        if (anchorJoint.obj instanceof Wheel) return false;
      } else if (
        anchorJoint.joint &&
        Object.values(anchorJoint.joint.bodies).find(
          (body) => body.gameObject instanceof Wheel,
        )
      )
        return false;
    } else if (intersectsOtherSolid(this.scene, drawObj.obj)) return false;

    return true;
  }

  *getConnections(_drawObj) {
    const cursor = this.scene.cursor;

    const anchorJoint = cursor.getData('connectAnchorJoint');

    if (cursor.visible && anchorJoint) yield anchorJoint;
    // {
    //   body: anchorJoint.obj
    //     ? anchorJoint.obj.body
    //     : getFirstValue(anchorJoint.joint.bodies),
    //   x: drawObj.obj.x,
    //   y: drawObj.obj.y,
    // };
  }

  activateObject(destroy = false) {
    const drawObj = this.drawObj;
    if (drawObj) {
      this.drawObj = null;
      const { obj } = drawObj;

      if (destroy) obj.destroy();
      else {
        if (!this.canPlaceObject(drawObj)) {
          obj.destroy();
          return drawObj;
        }

        obj.enablePhysics();

        for (const anchorJoint of this.getConnections(drawObj)) {
          stiffConnect(this.scene, obj.body, anchorJoint);
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
      if (cursor.visible) {
        x = cursor.x;
        y = cursor.y;
      }

      // TODO: using `toolKey` for the object key is kinda dirty
      /** @type {import('../objects/Part').default} */
      const obj = new OBJECTS[this.toolKey](this.scene, x, y);
      obj.render();
      this.drawObj = { obj };
      this.scene.parts.add(obj);

      const anchorJoint = cursor.getData('connectAnchorJoint');
      if (cursor.visible && anchorJoint) {
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
