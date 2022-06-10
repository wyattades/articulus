/* eslint-disable consistent-return */
import Phaser from 'phaser';

import {
  constrain,
  EventManager,
  factoryRotateAround,
  midpoint,
  TEMP_RECT,
} from 'lib/utils';
import Controls from 'src/objects/Controls';
import type { Part } from 'src/objects';

import Tool from './Tool';
import { MIN_SHAPE_SIZE } from './ShapeTool';

type DragCustomUpdate = (obj: Part | Controls, x: number, y: number) => void;

type DragData = {
  obj: Part | Controls;
  dx: number;
  dy: number;
  customUpdate?: DragCustomUpdate;
};

export default class ControlsTool extends Tool {
  controls = new Controls(this.scene);

  selectedDragging: (DragData & { cdx: number; cdy: number })[] | null = null;

  controlRotating: {
    iRotation: number;
    moved?: boolean;
    iSelected: {
      obj: Part;
      x: number;
      y: number;
      rotation: number;
    }[];
  } | null = null;

  controlDragging: {
    edgeObj: Phaser.GameObjects.Rectangle;
    moved?: boolean;
    startDelta: Point;
    oppCorner: Point;
    center: Point;
    invW: number;
    invH: number;
    iSelected: {
      obj: Part;
      rotation: number;
      bounds: Phaser.Geom.Rectangle;
      points?: Point[];
    }[];
  } | null = null;

  eventManager = new EventManager()
    .on(this.scene.events, 'setSelected', this.setSelected.bind(this))
    .on(this.scene.events, 'setDragging', this.setDragging.bind(this));

  onDrag: DragCustomUpdate = (_controls, x, y) => {
    this.controls.setPosition(x, y);
    for (const { obj, cdx, cdy } of this.selectedDragging!) {
      obj.setPosition(x + cdx, y + cdy);
    }
  };

  setSelected(selected: Part[]) {
    this.controls.setSelected(selected);
  }

  setDragging(activeDrag: { dragging: DragData[]; x: number; y: number }) {
    if (!activeDrag?.dragging) return;

    const { dragging, x, y } = activeDrag;
    if ((this.scene.selected as any[] | undefined)?.includes(dragging[0].obj)) {
      this.selectedDragging = dragging.map((d) => ({
        ...d,
        cdx: d.obj.x - this.controls.x,
        cdy: d.obj.y - this.controls.y,
      }));

      activeDrag.dragging = [
        {
          customUpdate: this.onDrag,
          obj: this.controls,
          dx: this.controls.x - x,
          dy: this.controls.y - y,
        },
      ];
    }
  }

  handlePointerDown(x: number, y: number) {
    const c = this.controls;
    const selected = this.scene.selected;

    if (!selected?.length) return;
    if (!c.edgeObjs[0].visible) return;

    for (const edgeObj of c.edgeObjs) {
      if (edgeObj.getBounds(TEMP_RECT).contains(x, y)) {
        const oppCorner = Phaser.Math.Rotate(
          {
            x: edgeObj.originX === 1 ? c.width : -c.width,
            y: edgeObj.originY === 1 ? c.height : -c.height,
          },
          c.rotation,
        );
        oppCorner.x += edgeObj.x;
        oppCorner.y += edgeObj.y;

        this.controlDragging = {
          edgeObj,

          // delta of click position on edgeObj
          startDelta: {
            x: edgeObj.x - x,
            y: edgeObj.y - y,
          },

          // opposite corner from edgeObj
          oppCorner,

          center: midpoint(edgeObj, oppCorner),

          invW: 1 / c.width, // inverse initial control height
          invH: 1 / c.height, // inverse initial control width

          iSelected: selected.map((s) => ({
            obj: s,
            rotation: s.rotation,
            bounds: new Phaser.Geom.Rectangle(
              s.x - s.width / 2,
              s.y - s.height / 2,
              s.width,
              s.height,
            ),
            points: s.polygon?.points?.map((p) => ({
              x: p.x,
              y: p.y,
            })),
          })),
        };

        return false;
      }
    }

    if (c.rotateObj.getBounds(TEMP_RECT).contains(x, y)) {
      this.controlRotating = {
        iRotation: c.rotation,
        iSelected: selected.map((s) => ({
          obj: s,
          x: s.x,
          y: s.y,
          rotation: s.rotation,
        })),
      };

      return false;
    }
  }

  // NOTE: this method does not sheer non-polygon shapes when we're scaling
  // the shape at a different angle than the shape's angle. We would have
  // to convert the ellipse/rectangle to a polygon first, which seems worse.
  updateSelected(draggedPos: Point) {
    const {
      oppCorner,
      invW,
      invH,
      iSelected,
      center: iCenter,
    } = this.controlDragging!;
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

    const bounds = TEMP_RECT;

    for (const { obj, bounds: iBounds, points: iPoints } of iSelected) {
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

      obj.mutateBounds(bounds, iBounds, iPoints);

      obj.rerender();
    }
  }

  updateSelectedRotation() {
    const { rotation } = this.controls;
    const { iSelected, iRotation } = this.controlRotating!;

    const center = {
      x: this.controls.x + this.controls.width / 2,
      y: this.controls.y + this.controls.height / 2,
    };
    const rotateAround = factoryRotateAround(center, rotation - iRotation);

    for (const s of iSelected) {
      const { obj } = s;

      obj.setRotation(s.rotation + rotation - iRotation);
      if (iSelected.length > 1) {
        const p = rotateAround({ x: s.x, y: s.y });

        obj.setPosition(p.x, p.y);
      }
    }
  }

  handlePointerMove(x: number, y: number) {
    if (this.controlDragging) {
      this.controlDragging.moved = true;

      const { edgeObj, startDelta, oppCorner } = this.controlDragging;
      const { rotation } = this.controls;

      const newPos = { x: x + startDelta.x, y: y + startDelta.y };
      this.scene.snapToGrid(newPos);

      Phaser.Math.RotateAround(newPos, oppCorner.x, oppCorner.y, -rotation);

      const minSize = MIN_SHAPE_SIZE;

      newPos.x = constrain(
        newPos.x,
        edgeObj.originX === 0 ? oppCorner.x + minSize : null,
        edgeObj.originX === 1 ? oppCorner.x - minSize : null,
      );
      newPos.y = constrain(
        newPos.y,
        edgeObj.originY === 0 ? oppCorner.y + minSize : null,
        edgeObj.originY === 1 ? oppCorner.y - minSize : null,
      );

      Phaser.Math.RotateAround(newPos, oppCorner.x, oppCorner.y, rotation);

      edgeObj.setPosition(newPos.x, newPos.y);
      this.controls.updateFromCorners(oppCorner, edgeObj);
      this.updateSelected(newPos);

      return false;
    }

    if (this.controlRotating) {
      this.controlRotating.moved = true;

      let r =
        Math.atan2(
          y - this.controls.y - this.controls.height / 2,
          x - this.controls.x - this.controls.width / 2,
        ) +
        Math.PI / 2;

      if (this.scene.snappingEnabled) {
        const snap = Math.PI / 16;
        r = Math.round(r / snap) * snap;
      }

      this.controls.setRotation(r);

      this.updateSelectedRotation();

      return false;
    }
  }

  handlePointerUp(_x: number, _y: number, _pointer: Phaser.Input.Pointer) {
    if (this.controlDragging) {
      if (this.controlDragging.moved) {
        for (const { obj } of this.controlDragging.iSelected) obj.saveRender();
      }
      this.controlDragging = null;
    }

    if (this.controlRotating) this.controlRotating = null;
  }

  destroy() {
    this.eventManager.off();
    this.controls.destroy(true, true); // destroy it's children too
  }
}
