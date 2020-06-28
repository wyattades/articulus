import * as R from 'ramda';

import Tool from './Tool';
import { getTopObject, valuesIterator } from '../lib/utils';
import {
  getConnectedObjects,
  serializePhysics,
  deserializePhysics,
  getJointPos,
} from '../lib/physics';
import { Line } from '../objects';
import { fromJSON } from '../lib/saver';

export default class DragTool extends Tool {
  setDragging(objects, x, y) {
    let activeDrag = null;
    if (objects?.length) {
      activeDrag = {
        x,
        y,
        dragging: objects.map((obj) => ({
          obj,
          dx: obj.x - x,
          dy: obj.y - y,
        })),
      };
    }

    this.scene.activeDrag = activeDrag;
    this.scene.events.emit('setDragging', activeDrag);
  }

  setDraggingAnchor(anchorJoint, x, y) {
    if (!anchorJoint) {
      this.scene.activeDrag = null;
      return;
    }

    // TODO: this is horribly inefficient
    const afterPlace = () => {
      const sobjs = this.scene.parts.getChildren().map((p) => {
        const sobj = p.toJSON();
        sobj.id = p.id;
        return sobj;
      });
      const physData = serializePhysics(this.scene);
      this.scene.parts.clear(true, true);
      for (const sobj of sobjs) {
        const obj = fromJSON(this.scene, sobj, true);
        if (obj) this.scene.parts.add(obj);
        else console.warn('failed to recompute in afterPlace', sobj);
      }
      deserializePhysics(this.scene, physData);
    };

    let dragging;

    if (anchorJoint.obj) {
      dragging = [[anchorJoint, anchorJoint.id, anchorJoint.obj.body]];
    } else {
      dragging = Object.values(
        anchorJoint.joint.bodies,
      ).map(([anchorId, body]) => [anchorJoint, anchorId, body]);
    }

    const more = [];
    for (const [_, __, body] of dragging) {
      const obj = body.gameObject;
      if (!(obj instanceof Line)) {
        for (const joint of valuesIterator(body.collisionFilter.joints)) {
          const pos = getJointPos(joint);
          more.push(
            ...Object.values(joint.bodies).map(([anchorId, body]) => [
              pos,
              anchorId,
              body,
            ]),
          );
        }
      }
    }

    const setStart = (nobj, nx, ny) => {
      nobj.setStart(nx, ny);
      nobj.rerender();
    };
    const setEnd = (nobj, nx, ny) => {
      nobj.setEnd(nx, ny);
      nobj.rerender();
    };

    dragging = R.uniqBy((a) => a[2], dragging.concat(more)).map(
      ([pos, anchorId, body]) => {
        const obj = body.gameObject;

        if (obj instanceof Line) {
          return {
            customUpdate: anchorId === 0 ? setStart : setEnd,
            obj,
            dx: pos.x - x,
            dy: pos.y - y,
          };
        } else
          return {
            obj,
            dx: obj.x - x,
            dy: obj.y - y,
          };
      },
    );

    this.scene.activeDrag = {
      afterPlace,
      dragging,
      x,
      y,
    };
  }

  handlePointerDown(x, y) {
    const cursor = this.scene.cursor;
    const anchorJoint = cursor?.visible && cursor.getData('connectAnchorJoint');
    if (anchorJoint) {
      this.setDraggingAnchor(anchorJoint, x, y);
      return false;
    }

    const topObject = getTopObject(this.scene, x, y);
    if (topObject) {
      let dragging;

      const selected = this.scene.selected;
      if (selected?.includes(topObject)) {
        dragging = getConnectedObjects(selected);
      } else {
        dragging = getConnectedObjects(topObject);
      }

      this.setDragging(dragging, x, y);

      // return false;
    }
  }

  handlePointerMove(x, y) {
    this.refreshCursor(x, y);

    const { activeDrag } = this.scene;
    if (!activeDrag) return;

    if (activeDrag.moved !== true) activeDrag.moved = true;

    if (activeDrag.dragging) {
      for (const { obj, dx = 0, dy = 0, customUpdate } of activeDrag.dragging) {
        const newPos = { x: x + dx, y: y + dy };
        this.scene.snapToGrid(newPos);
        // `obj` may be `Controls`, which is a `Group` with a custom `setPosition` method
        // which should be called only once for performance

        if (customUpdate) customUpdate(obj, newPos.x, newPos.y);
        else obj.setPosition(newPos.x, newPos.y);
      }
      return false;
    }
  }

  handlePointerUp(x, y) {
    const { activeDrag } = this.scene;

    if (activeDrag) {
      this.setDragging(null);
      if (activeDrag.moved) {
        for (const { obj } of activeDrag.dragging) obj.saveRender();

        activeDrag.afterPlace?.(x, y);

        return false;
      }
    }
  }
}
