import Line from '../objects/Line';
import { intersectsOtherSolid, anySame } from '../lib/utils';
import PlaceTool from './PlaceTool';

export default class LineTool extends PlaceTool {
  canPlaceObject(drawObj) {
    if (drawObj.obj.length < Line.MIN_LENGTH) return false;

    const cursor = this.scene.cursor;

    const start = drawObj.startAnchorJoint;
    const end = cursor?.visible && cursor.getData('connectAnchorJoint');

    const ignore = [];

    if (start) {
      if (start.obj) ignore.push(start.obj);
      else
        for (const id in start.joint.bodies)
          ignore.push(start.joint.bodies[id][1].gameObject);
    }
    if (end) {
      if (end.obj) ignore.push(end.obj);
      else
        for (const id in end.joint.bodies)
          ignore.push(end.joint.bodies[id][1].gameObject);
    }

    if (
      start &&
      end &&
      anySame(
        start.obj ? { [start.obj.body.id]: true } : start.joint.bodies,
        end.obj ? { [end.obj.body.id]: true } : end.joint.bodies,
      )
    )
      return false;

    if (intersectsOtherSolid(this.scene, drawObj.obj, ignore)) return false;

    return true;
  }

  *getConnections(drawObj) {
    const cursor = this.scene.cursor;
    const { startAnchorJoint } = drawObj;

    const start = startAnchorJoint;
    const end = cursor?.visible && cursor.getData('connectAnchorJoint');

    if (start) yield [start, 0];
    if (end) yield [end, 1];
  }

  handleObjDrag(x, y) {
    const obj = this.drawObj.obj;
    obj.setEnd(x, y);
    obj.rerender();
  }
}
