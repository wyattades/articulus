import Line from '../objects/Line';
import { intersectsOtherSolid, anySame } from '../lib/utils';
import PlaceTool from './PlaceTool';

export default class LineTool extends PlaceTool {
  canPlaceObject(drawObj) {
    if (drawObj.obj.length < Line.MIN_LENGTH) return false;

    const cursor = this.scene.cursor;

    const { obj: start, x: startX, y: startY } = drawObj.startData || {};
    const end = cursor.visible && cursor.getData('connectObj');

    const ignore = [];

    let startJoint, endJoint;
    if (start) {
      startJoint = this.getJointAt(start, startX, startY);
      if (startJoint)
        for (const id in startJoint.bodies)
          ignore.push(startJoint.bodies[id].gameObject);
      else ignore.push(start);
    }
    if (end) {
      endJoint = this.getJointAt(end, cursor.x, cursor.y);
      if (endJoint) {
        for (const id in endJoint.bodies)
          ignore.push(endJoint.bodies[id].gameObject);
      } else ignore.push(end);
    }

    if (
      (start || startJoint) &&
      (end || endJoint) &&
      anySame(
        startJoint ? startJoint.bodies : { [start.body.id]: true },
        endJoint ? endJoint.bodies : { [end.body.id]: true },
      )
    )
      return false;

    if (
      drawObj.obj.length < Line.MIN_LENGTH ||
      intersectsOtherSolid(this.scene, drawObj.obj, ignore)
    )
      return false;

    return true;
  }

  *getConnections(drawObj) {
    const cursor = this.scene.cursor;
    const { startData } = drawObj;

    const start = startData && startData.obj;
    const end = cursor.visible && cursor.getData('connectObj');

    if (start) yield { body: start.body, x: startData.x, y: startData.y };
    if (end) yield { body: end.body, x: cursor.x, y: cursor.y };
  }

  handleObjDrag(x, y) {
    const obj = this.drawObj.obj;
    obj.setEnd(x, y);
    obj.clear();
    obj.render();
  }
}
