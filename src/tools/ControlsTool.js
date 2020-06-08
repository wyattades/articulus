/* eslint-disable consistent-return */
import Phaser from 'phaser';

import { EventManager } from '../lib/utils';
import Tool from './Tool';
import Controls from '../objects/Controls';
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

  setDragging = (activeDrag) => {
    if (!activeDrag?.dragging) return;

    const { dragging, x, y } = activeDrag;
    if (
      this.scene.selected &&
      this.scene.selected.indexOf(dragging[0].obj) !== -1
    ) {
      for (const data of dragging) {
        data.cdx = data.obj.x - this.controls.x;
        data.cdy = data.obj.y - this.controls.y;
      }

      activeDrag.dragging = [
        {
          obj: this.controls,
          afterUpdate(_obj, x, y) {
            for (const { obj, cdx, cdy } of dragging) {
              obj.setPosition(x + cdx, y + cdy);
            }
          },
          ix: x,
          iy: y,
          dx: this.controls.x - x,
          dy: this.controls.y - y,
        },
      ];
    }
  };

  handlePointerDown(x, y) {
    if (!this.controls.getChildren()[0].visible) return;

    const bounds = new Phaser.Geom.Rectangle();
    for (const obj of this.controls.edgeObjs) {
      if (obj.getBounds(bounds).contains(x, y)) {
        const c = this.controls;

        this.controlDragging = {
          obj,
          dx: obj.x - x,
          dy: obj.y - y,

          ox: obj.x + (obj.originX === 1 ? c.width : -c.width),
          oy: obj.y + (obj.originY === 1 ? c.height : -c.height),
          invW: 1 / c.width, // inverse initial control height
          invH: 1 / c.height, // inverse initial control width

          iSelected: this.scene.selected.map((s) => ({
            x: s.x,
            y: s.y,
            right: s.x + s.width,
            bottom: s.y + s.height,
          })),
        };

        return false;
      }
    }
  }

  updateSelected() {
    const { ox, oy, invW, invH, iSelected } = this.controlDragging;
    const { width: cw, height: ch } = this.controls;

    const scaleX = cw * invW;
    const scaleY = ch * invH;

    const bounds = (this._bounds = this._bounds || new Phaser.Geom.Rectangle());

    for (let i = 0, obj, s; i < iSelected.length; i++) {
      s = iSelected[i];
      obj = this.scene.selected[i];

      obj.getBounds(bounds);

      bounds.x = ox - scaleX * (ox - s.x);
      bounds.y = oy - scaleY * (oy - s.y);
      bounds.right = ox - scaleX * (ox - s.right);
      bounds.bottom = oy - scaleY * (oy - s.bottom);

      obj.setPosition(bounds.x, bounds.y);
      obj.setSize(bounds.width, bounds.height);

      obj.render();
    }
  }

  handlePointerMove(x, y, _pointer) {
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
  }

  handlePointerUp(_x, _y, _pointer) {
    if (this.controlDragging) {
      // const moved = this.controlDragging.moved;
      this.controlDragging = null;
      // if (moved) return false;
    }
  }
}
