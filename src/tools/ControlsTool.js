/* eslint-disable consistent-return */
import Phaser from 'phaser';

import { EventManager, factoryRotateAround } from 'lib/utils';
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
        this.controlDragging = {
          obj,
          dx: obj.x - x,
          dy: obj.y - y,

          ox: obj.x + (obj.originX === 1 ? c.width : -c.width),
          oy: obj.y + (obj.originY === 1 ? c.height : -c.height),
          invW: 1 / c.width, // inverse initial control height
          invH: 1 / c.height, // inverse initial control width

          iSelected: this.scene.selected.map((s) => ({
            obj: s,
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
        sr: c.rotation,
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

  updateSelected() {
    const { ox, oy, invW, invH, iSelected } = this.controlDragging;
    const { width: cw, height: ch } = this.controls;

    const scaleX = cw * invW;
    const scaleY = ch * invH;

    const bounds = (this._bounds ||= new Phaser.Geom.Rectangle());

    for (const { obj, bounds: iBounds, points: iPoints } of iSelected) {
      bounds.x = ox - scaleX * (ox - iBounds.x);
      bounds.y = oy - scaleY * (oy - iBounds.y);
      bounds.right = ox - scaleX * (ox - iBounds.right);
      bounds.bottom = oy - scaleY * (oy - iBounds.bottom);

      obj.mutateBounds(bounds, iBounds, iPoints);

      obj.rerender();
    }
  }

  updateSelectedRotation() {
    const { rotation } = this.controls;
    const { iSelected, sr } = this.controlRotating;

    const rotateAround = factoryRotateAround(
      {
        x: this.controls.x + this.controls.width / 2,
        y: this.controls.y + this.controls.height / 2,
      },
      rotation,
    );

    for (const s of iSelected) {
      const { obj } = s;

      obj.setRotation(s.angle + rotation - sr);
      if (iSelected.length > 1) {
        const p = rotateAround(s);

        obj.setPosition(p.x, p.y);
      }
    }
  }

  handlePointerMove(x, y) {
    if (this.controlDragging) {
      this.controlDragging.moved = true;
      const { obj, dx, dy, ox, oy } = this.controlDragging;

      const newPos = { x: x + dx, y: y + dy };
      this.scene.snapToGrid(newPos);
      obj.setPosition(newPos.x, newPos.y);

      const minSize = MIN_SHAPE_SIZE;
      if (obj.originX === 0 && obj.x < ox + minSize) obj.x = ox + minSize;
      else if (obj.originX === 1 && obj.x > ox - minSize) obj.x = ox - minSize;
      if (obj.originY === 0 && obj.y < oy + minSize) obj.y = oy + minSize;
      else if (obj.originY === 1 && obj.y > oy - minSize) obj.y = oy - minSize;

      this.controls.updateFrom(obj);
      this.updateSelected();

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
