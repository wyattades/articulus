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
    return Object.values(obj.body.collisionFilter.joints).find(
      (j) => {
        const pos = getJointPos(j);
        return Phaser.Math.Distance.Squared(pos.x, pos.y, x, y) <= 1;
      },
    );
  }

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
/*
ignoreSelf = (obj) => this.drawLine && obj === this.drawLine.line;

refreshCursor(x, y) {
  const cursor = this.scene.cursor;
  const hovered = this.getHovered(x, y, this.ignoreSelf);
  if (hovered) {
    cursor.setPosition(hovered.x, hovered.y);
    cursor.setData('connectObj', hovered.obj);
  }
  if (!!hovered !== cursor.visible) cursor.setVisible(!!hovered);
  return hovered;
}

activateDrawLine(destroy = false) {
  let drawLine = null;
  if (this.drawLine) {
    drawLine = this.drawLine;
    this.drawLine = null;

    if (destroy) drawLine.line.destroy();
    else {
      const { line, startData } = drawLine;

      const start = startData && startData.obj;
      const end =
        this.scene.cursor.visible && this.scene.cursor.getData('connectObj');

      if (start === end || line.length < Line.MIN_LENGTH) {
        line.destroy();
        return drawLine;
      }

      const intersected = intersectsOtherSolid(this.scene, line);
      if (intersected && intersected !== start && intersected !== end) {
        line.destroy();
        return drawLine;
      }

      line.enablePhysics();

      if (start)
        stiffConnect(this.scene, start.body, line.body, {
          x: startData.x,
          y: startData.y,
        });
      if (end)
        stiffConnect(this.scene, end.body, line.body, {
          x: this.scene.cursor.x,
          y: this.scene.cursor.y,
        });
    }
  }

  return drawLine;
}

handlePointerDown(x, y) {
  const lineExisted = this.activateDrawLine(true);

  if (!lineExisted) {
    if (this.scene.cursor.visible) {
      x = this.scene.cursor.x;
      y = this.scene.cursor.y;
    }

    const line = new OBJECTS[this.partType](this.scene, x, y, x, y);
    line.render();
    this.drawLine = { x, y, line };
    this.scene.parts.add(line);
    if (this.scene.cursor.visible) {
      this.drawLine.startData = {
        x,
        y,
        obj: this.scene.cursor.getData('connectObj'),
      };
    }
  }
}

handleMove(x, y) {
  const jointPoint = this.refreshCursor(x, y);
  if (this.drawLine) {
    if (jointPoint) {
      x = jointPoint.x;
      y = jointPoint.y;
    }
    this.drawLine.line.setEnd(x, y);
  }
}

handlePointerUp(x, y) {
  if (this.activateDrawLine()) {
    this.refreshCursor(x, y);
  }
}
*/
