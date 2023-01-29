import * as _ from 'lodash-es';

import { valuesIterator } from 'lib/utils';
import { getTopObject } from 'lib/utils/phaser';
import {
  getConnectedObjects,
  serializePhysics,
  deserializePhysics,
  getJointPos,
} from 'lib/physics';
import { Line, Rectangle } from 'src/objects';
import { fromJSON } from 'lib/saver';

import Tool from './Tool';

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
      dragging = Object.values(anchorJoint.joint.bodies).map(
        ([anchorId, body]) => [anchorJoint, anchorId, body],
      );
    }

    const more = [];
    for (const [_1, _2, body] of dragging) {
      const obj = body.gameObject;
      if (!(obj instanceof Line)) {
        for (const joint of valuesIterator(body.collisionFilter.joints)) {
          const pos = getJointPos(joint);
          for (const [anchorId, body2] of Object.values(joint.bodies)) {
            more.push([pos, anchorId, body2]);
          }
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

    dragging = _.uniqBy([...dragging, ...more], (a) => a[2])
      .map(([pos, anchorId, body]) => {
        const obj = body.gameObject;
        if (!obj) {
          console.warn(`Body missing gameObject: ${body.id}`, body);
          return null;
        }

        if (obj instanceof Line) {
          return {
            customUpdate: anchorId === 0 ? setStart : setEnd,
            obj,
            dx: pos.x - x,
            dy: pos.y - y,
          };
        } else {
          return {
            obj,
            dx: obj.x - x,
            dy: obj.y - y,
          };
        }
      })
      .filter(Boolean);

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
        // Rectangle/Ellipse should snap to top-left corner, unless they're rotated
        if (obj instanceof Rectangle && obj.rotation === 0) {
          newPos.x -= obj.width / 2;
          newPos.y -= obj.height / 2;
          this.scene.snapToGrid(newPos);
          newPos.x += obj.width / 2;
          newPos.y += obj.height / 2;
        } else {
          this.scene.snapToGrid(newPos);
        }

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

    if (!activeDrag) return;

    this.setDragging(null);
    if (activeDrag.moved) {
      for (const { obj } of activeDrag.dragging) obj.saveRender();

      activeDrag.afterPlace?.(x, y);

      this.refreshCursor(x, y);

      return false;
    }
  }
}
