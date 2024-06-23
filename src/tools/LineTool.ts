import { placedPartBlocker } from 'lib/partPlacement';
import { haveAnySameKey } from 'lib/utils';
import Line from 'src/objects/Line';

import PlaceTool from './PlaceTool';

type LineDrawObj = {
  obj: Line;
  startAnchorJoint?: FC.AnchorJoint;
}; // satisfies DrawObj;

export default class LineTool extends PlaceTool {
  drawObj: LineDrawObj | null = null;

  canPlaceObject(drawObj: LineDrawObj) {
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
      haveAnySameKey(
        start.obj ? { [start.obj.body!.id]: true } : start.joint.bodies,
        end.obj ? { [end.obj.body!.id]: true } : end.joint.bodies,
      )
    )
      return false;

    if (
      placedPartBlocker(drawObj.obj, {
        objects: this.scene.parts.getChildren(),
        terrains: this.scene.terrainGroup?.getChildren(),
        ignoreObjects: ignore,
      })
    )
      return false;

    return true;
  }

  *getConnections(drawObj: LineDrawObj): Generator<[FC.AnchorJoint, number]> {
    const cursor = this.scene.cursor;
    const { startAnchorJoint } = drawObj;

    const start = startAnchorJoint;
    const end = cursor?.visible && cursor.getData('connectAnchorJoint');

    if (start) yield [start, 0];
    if (end) yield [end, 1];
  }

  handleObjDrag(x: number, y: number) {
    const obj = this.drawObj?.obj;
    if (obj) {
      obj.setEnd(x, y);
      obj.rerender();
    }
  }
}
