/* eslint-disable consistent-return */
import Phaser from 'phaser';

import {
  constrain,
  EventManager,
  factoryRotateAround,
  midpoint,
} from 'lib/utils';
import Controls from 'src/objects/Controls';

import Tool from './Tool';
import { MIN_SHAPE_SIZE } from './ShapeTool';

export default class ControlsTool extends Tool {
  controls = new Controls(this.scene, 0, 0, 1, 1);
  controlDragging = null;

  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene, toolKey) {
    super(scene, toolKey);

    this.eventManager = new EventManager()
      .on(scene.events, 'setSelected', this.setSelected)
      .on(scene.events, 'setDragging', this.setDragging);
  }

  destroy() {
    this.eventManager.off();
    this.controls.destroy(true); // destroy it's children too
  }

  setSelected = (selected) => {
    this.controls.setSelected(selected);
  };

  onDrag = (_controls, x, y) => {
    this.controls.setPosition(x, y);
    for (const { obj, cdx, cdy } of this.selectedDragging) {
      obj.setPosition(x + cdx, y + cdy);
    }
  };

  setDragging = (activeDrag) => {
    if (!activeDrag?.dragging) return;

    const { dragging, x, y } = activeDrag;
    if (this.scene.selected?.includes(dragging[0].obj)) {
      for (const data of dragging) {
        data.cdx = data.obj.x - this.controls.x;
        data.cdy = data.obj.y - this.controls.y;
      }
      this.selectedDragging = dragging;

      activeDrag.dragging = [
        {
          customUpdate: this.onDrag,
          obj: this.controls,
          dx: this.controls.x - x,
          dy: this.controls.y - y,
        },
      ];
    }
  };

  handlePointerDown(x, y) {
    const c = this.controls;

    if (!c.edgeObjs[0].visible) return;

    const tempBounds = (this._bounds ||= new Phaser.Geom.Rectangle());

    for (const obj of c.edgeObjs) {
      if (obj.getBounds(tempBounds).contains(x, y)) {
        const oppCorner = Phaser.Math.Rotate(
          {
            x: obj.originX === 1 ? c.width : -c.width,
            y: obj.originY === 1 ? c.height : -c.height,
          },
          c.rotation,
        );
        oppCorner.x += obj.x;
        oppCorner.y += obj.y;

        this.controlDragging = {
          obj,

          // delta of click position on edgeObj
          startDelta: {
            x: obj.x - x,
            y: obj.y - y,
          },

          // opposite corner from edgeObj
          oppCorner,

          center: midpoint(obj, oppCorner),

          invW: 1 / c.width, // inverse initial control height
          invH: 1 / c.height, // inverse initial control width

          iSelected: this.scene.selected.map((s) => ({
            obj: s,
            rotation: s.rotation,
            bounds: new Phaser.Geom.Rectangle(
              s.x - s.width / 2,
              s.y - s.height / 2,
              s.width,
              s.height,
            ),
            points: s.polygon?.points?.map((p) => ({ x: p.x, y: p.y })),
          })),
        };

        return false;
      }
    }

    if (c.rotateObj.getBounds(tempBounds).contains(x, y)) {
      this.controlRotating = {
        iRotation: c.rotation,
        iSelected: this.scene.selected.map((s) => ({
          obj: s,
          x: s.x,
          y: s.y,
          angle: s.rotation,
        })),
      };

      return false;
    }
  }

  /** @type {Phaser.Geom.Rectangle} */
  _bounds;

  // NOTE: this method does not sheer non-polygon shapes when we're scaling
  // the shape at a different angle than the shape's angle. We would have
  // to convert the ellipse/rectangle to a polygon first, which seems worse.
  updateSelected(draggedPos) {
    const {
      oppCorner,
      invW,
      invH,
      iSelected,
      center: iCenter,
    } = this.controlDragging;
    const c = this.controls;

    const newCenter = midpoint(draggedPos, oppCorner);

    const origin = iCenter;

    const iCenterRot = Phaser.Math.RotateAround(
      { x: iCenter.x, y: iCenter.y },
      origin.x,
      origin.y,
      -c.rotation,
    );
    const newCenterRot = Phaser.Math.RotateAround(
      { x: newCenter.x, y: newCenter.y },
      origin.x,
      origin.y,
      -c.rotation,
    );

    const scaleX = c.width * invW;
    const scaleY = c.height * invH;

    const bounds = (this._bounds ||= new Phaser.Geom.Rectangle());

    for (const {
      obj,
      bounds: iBounds,
      points: iPoints,
      rotation: iRotation,
    } of iSelected) {
      const iPosRot = Phaser.Math.RotateAround(
        { x: iBounds.centerX, y: iBounds.centerY },
        origin.x,
        origin.y,
        -c.rotation,
      );

      const pos = Phaser.Math.RotateAround(
        {
          x: newCenterRot.x + (iPosRot.x - iCenterRot.x) * scaleX,
          y: newCenterRot.y + (iPosRot.y - iCenterRot.y) * scaleY,
        },
        origin.x,
        origin.y,
        c.rotation,
      );

      bounds.width = iBounds.width * scaleX;
      bounds.height = iBounds.height * scaleY;

      bounds.centerX = pos.x;
      bounds.centerY = pos.y;

      obj.mutateBounds(bounds, iBounds, iPoints, iRotation - c.rotation);

      obj.rerender();
    }
  }

  updateSelectedRotation() {
    const { rotation } = this.controls;
    const { iSelected, iRotation } = this.controlRotating;

    const rotateAround = factoryRotateAround(
      {
        x: this.controls.x + this.controls.width / 2,
        y: this.controls.y + this.controls.height / 2,
      },
      rotation,
    );

    for (const s of iSelected) {
      const { obj } = s;

      obj.setRotation(s.angle + rotation - iRotation);
      if (iSelected.length > 1) {
        const p = rotateAround({ x: s.x, y: s.y });

        obj.setPosition(p.x, p.y);
      }
    }
  }

  handlePointerMove(x, y) {
    if (this.controlDragging) {
      this.controlDragging.moved = true;
      const { obj, startDelta, oppCorner } = this.controlDragging;
      const { rotation } = this.controls;

      const newPos = { x: x + startDelta.x, y: y + startDelta.y };
      this.scene.snapToGrid(newPos);

      Phaser.Math.RotateAround(newPos, oppCorner.x, oppCorner.y, -rotation);

      const minSize = MIN_SHAPE_SIZE;

      newPos.x = constrain(
        newPos.x,
        obj.originX === 0 ? oppCorner.x + minSize : null,
        obj.originX === 1 ? oppCorner.x - minSize : null,
      );
      newPos.y = constrain(
        newPos.y,
        obj.originY === 0 ? oppCorner.y + minSize : null,
        obj.originY === 1 ? oppCorner.y - minSize : null,
      );

      Phaser.Math.RotateAround(newPos, oppCorner.x, oppCorner.y, rotation);

      obj.setPosition(newPos.x, newPos.y);
      this.controls.updateFromCorners(oppCorner, obj);
      this.updateSelected(newPos);

      return false;
    }

    if (this.controlRotating) {
      let r =
        Math.atan2(
          y - this.controls.y - this.controls.height / 2,
          x - this.controls.x - this.controls.width / 2,
        ) +
        Math.PI / 2;

      if (this.scene.gridSize) {
        const snap = Math.PI / 16;
        r = Math.round(r / snap) * snap;
      }

      this.controls.setRotation(r);

      this.updateSelectedRotation();

      return false;
    }
  }

  handlePointerUp(_x, _y, _pointer) {
    if (this.controlDragging) {
      // const moved = this.controlDragging.moved;
      for (const { obj } of this.controlDragging.iSelected) obj.saveRender();
      this.controlDragging = null;
      // if (moved) return false;
    }

    if (this.controlRotating) this.controlRotating = null;
  }
}
