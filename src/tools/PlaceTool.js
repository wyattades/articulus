import Phaser from 'phaser';

import { stiffConnect, getJointPos } from '../lib/physics';
import { Wheel, OBJECTS } from '../objects';
import Tool from './Tool';
import { intersectsOtherSolid, getHovered } from '../lib/utils';

export default class PlaceTool extends Tool {
  constructor(scene, partType) {
    super(scene);
    this.partType = partType;
  }

  /** @type {{ obj: Phaser.GameObjects.GameObject }} */
  drawObj = null;

  refreshCursor(x, y) {
    const cursor = this.scene.cursor;

    const hovered = getHovered(
      this.scene,
      x,
      y,
      this.drawObj && this.drawObj.obj,
    );
    if (hovered) {
      cursor.setPosition(hovered.x, hovered.y);
      cursor.setData('connectObj', hovered.obj);
    }
    if (!!hovered !== cursor.visible) cursor.setVisible(!!hovered);

    return hovered;
  }

  getJointAt(obj, x, y) {
    return Object.values(obj.body.collisionFilter.joints).find((j) => {
      const pos = getJointPos(j);
      return Phaser.Math.Distance.Squared(pos.x, pos.y, x, y) <= 1;
    });
  }

  // Overwritten by LineTool
  canPlaceObject(drawObj) {
    const cursor = this.scene.cursor;

    if (cursor.visible) {
      const connectObj = cursor.getData('connectObj');
      if (connectObj instanceof Wheel) return false;

      const joint = this.getJointAt(connectObj, cursor.x, cursor.y);
      if (
        joint &&
        Object.values(joint.bodies).find((b) => b.gameObject instanceof Wheel)
      )
        return false;
    } else if (intersectsOtherSolid(this.scene, drawObj.obj)) return false;

    return true;
  }

  getConnections(drawObj) {
    const c = [];
    if (this.scene.cursor.visible)
      c.push({
        body: this.scene.cursor.getData('connectObj').body,
        x: drawObj.obj.x,
        y: drawObj.obj.y,
      });
    return c;
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

        for (const { body, x, y } of this.getConnections(drawObj)) {
          stiffConnect(this.scene, body, obj.body, {
            x,
            y,
          });
        }
      }
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

      const obj = new OBJECTS[this.partType](this.scene, x, y);
      obj.render();
      this.drawObj = { obj };
      this.scene.parts.add(obj);

      if (cursor.visible) {
        this.drawObj.startData = {
          x,
          y,
          obj: cursor.getData('connectObj'),
        };
      }
    }
  }

  handleObjDrag(x, y) {
    this.drawObj.obj.setPosition(x, y);
  }

  handlePointerMove(x, y) {
    const jointPoint = this.refreshCursor(x, y);
    if (this.drawObj) {
      if (jointPoint) {
        x = jointPoint.x;
        y = jointPoint.y;
      }
      this.handleObjDrag(x, y);
    }
  }

  handlePointerUp(x, y) {
    if (this.activateObject()) this.refreshCursor(x, y);
  }
}
