import Tool from './Tool';
import { getTopObject, constrain } from '../lib/utils';
import {
  getConnectedObjects,
  serializePhysics,
  deserializePhysics,
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

    const afterUpdate = (obj) => {
      if (obj instanceof Line) {
        obj.clear();
        obj.render();
      }
    };

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
        const obj = fromJSON(this.scene, sobj);
        if (obj) {
          obj.enablePhysics();
          this.scene.parts.add(obj);
        } else console.warn('failed to recompute in afterPlace', sobj);
      }
      deserializePhysics(this.scene, physData);
    };

    const dragging = (anchorJoint.obj
      ? [[anchorJoint.id, anchorJoint.obj.body]]
      : Object.values(anchorJoint.joint.bodies)
    ).map(([anchorId, body]) => {
      const obj = body.gameObject;

      if (obj instanceof Line) {
        return {
          setPosFn: anchorId === 0 ? 'setStart' : 'setEnd',
          afterUpdate,
          obj,
          dx: 0,
          dy: 0,
        };
      }

      return {
        obj,
        dx: obj.x - x,
        dy: obj.y - y,
      };
    });

    this.scene.activeDrag = {
      afterPlace,
      dragging,
      x,
      y,
    };
  }

  handlePointerDown(x, y) {
    let topObject;

    // TODO
    const cursor = this.scene.cursor;
    const anchorJoint = cursor.getData('connectAnchorJoint');
    if (cursor.visible && anchorJoint) {
      const { obj } = anchorJoint;
      if (obj) {
        if (obj instanceof Line) {
          this.setDraggingAnchor(anchorJoint, x, y);
          return;
        } else topObject = obj; // not necessary, just an optimization
      } else {
        this.setDraggingAnchor(anchorJoint, x, y);
        return;
      }
    }

    if ((topObject = topObject || getTopObject(this.scene, x, y))) {
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
      for (const {
        obj,
        dx = 0,
        dy = 0,
        setPosFn = 'setPosition',
        afterUpdate,
      } of activeDrag.dragging) {
        const newPos = { x: x + dx, y: y + dy };
        this.scene.snapToGrid(newPos);
        // `obj` may be `Controls`, which is a `Group` with a custom `setPosition` method
        // which should be called only once for performance

        obj[setPosFn](newPos.x, newPos.y);

        afterUpdate?.(obj, newPos.x, newPos.y);
      }
      return false;
    }
  }

  handlePointerUp(x, y) {
    const { activeDrag } = this.scene;

    if (activeDrag) {
      this.setDragging(null);
      if (activeDrag.moved) {
        activeDrag.afterPlace?.(x, y);

        return false;
      }
    }
  }
}
