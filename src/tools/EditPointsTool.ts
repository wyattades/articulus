import * as _ from 'lodash-es';
import Flatten from '@flatten-js/core';

import { addHoverCursor, EventManager } from 'src/lib/utils';
import { Polygon } from 'src/objects/Polygon';
import type { BaseScene } from 'src/scenes/Scene';
import { minDistance } from 'src/lib/minDistance';

import Tool from './Tool';

export class Vert extends Phaser.GameObjects.Arc {
  __ = (() => {
    addHoverCursor(this.setInteractive(), 'grab');
  })();

  _selected = false;
  setHighlight(isSelected: boolean) {
    isSelected = !!isSelected;
    if (this._selected === isSelected) return;
    this._selected = isSelected;

    if (isSelected) this.setStrokeStyle(2, 0xffffff, 1);
    else this.setStrokeStyle(0, 0, 0);
  }
}

export default class EditPointsTool extends Tool {
  eventManager = new EventManager()
    .on(this.scene.input.keyboard, 'keydown-ESC', () => {
      this.createShape(true, true);
      this.unload();
    })
    .on(this.scene.input.keyboard, 'keydown-ENTER', () => {
      this.createShape(true, false);
      this.unload();
    });

  vertices: Vert[];
  lines: Phaser.GameObjects.Line[];
  originalPoints: Point[];

  unloaded = false;

  constructor(scene: BaseScene, toolKey: string, readonly original: Polygon) {
    super(scene, toolKey);

    this.vertices = [];
    this.lines = [];

    const points = (this.originalPoints = original.geom.points);

    for (let i = 0, len = points.length; i < len; i++) {
      const p = points[i];

      this.vertices.push(this.createVert(p.x, p.y));
    }

    this.createLines();

    // set it to invisible and destroy it when this tool unloads so the SaveManager still saves it
    original.setActive(false).setVisible(false);
  }

  createVert(x: number, y: number) {
    const vert = new Vert(this.scene, x, y, 5)
      .setFillStyle(0xff0000)
      .setDepth(1);
    this.scene.add.existing(vert);
    return vert;
  }

  createLines() {
    const points = this.vertices;

    while (this.lines.length > 0) this.lines.pop()!.destroy();

    for (let i = 0, len = points.length; i < len; i++) {
      const p = points[i];
      const prev = i === 0 ? points[len - 1] : points[i - 1];
      this.lines.push(
        this.scene.add
          .line(0, 0, prev.x, prev.y, p.x, p.y, 0xffffff)
          .setOrigin(0, 0),
      );
    }
  }

  unload() {
    this.original.destroy();
    while (this.vertices.length > 0) this.vertices.pop()!.destroy();
    while (this.lines.length > 0) this.lines.pop()!.destroy();
  }

  // make sure to call `unload()` at the end of this method
  createShape(setTool: boolean, revertToOriginal: boolean) {
    if (this.unloaded) return;
    this.unloaded = true;

    const points = revertToOriginal ? this.originalPoints : this.vertices;

    if (points.length < 3) {
      this.scene.showFlash('Not enough points!');

      if (setTool) this.scene.tm.setTool('polygon_shape');
      return;
    }

    const fpoly = new Flatten.Polygon(points.map((p) => [p.x, p.y]));

    if (!fpoly.isValid()) {
      this.scene.showFlash('Invalid polygon!');

      if (setTool) this.scene.tm.setTool('polygon_shape');
      return;
    }

    const newParts = [];
    for (const poly of fpoly.splitToIslands()) {
      const part = new Polygon(this.scene);
      part.polygon.setTo(poly.vertices);

      part.localizePoints();

      this.scene.parts.add(part as any);

      part.rerender();

      newParts.push(part);
    }

    if (setTool) {
      this.scene.tm.setTool('select');
      this.scene.events.emit('setSelected', newParts);
    }
  }

  dragging:
    | {
        obj: Phaser.GameObjects.Arc;
        dx: number;
        dy: number;
        index: number;
      }[]
    | null = null;

  selectedVerts: Vert[] = [];

  deleteSelected() {
    _.pullAll(this.vertices, this.selectedVerts);

    for (const v of this.selectedVerts) {
      v.destroy();
    }

    this.selectedVerts = [];

    this.createLines(); // TODO: be more efficient
  }

  updateSelected(next: Vert[]) {
    // @ts-expect-error Vert != Part
    this.scene.tm.getTool('select_points')?.setSelected(next);
  }

  handlePointerDown(
    x: number,
    y: number,
    { button }: Phaser.Input.Pointer,
  ): boolean | void {
    if (button === 2) {
      this.updateSelected([]);

      const p = { x, y };
      this.scene.snapToGrid(p);

      if (this.vertices.length <= 1) {
        this.vertices.push(this.createVert(p.x, p.y));
      } else {
        // example:
        //   original: P0 --Dist0-- P1 --Dist1-- P2
        //   let Dist1 be the smallest
        //   after inserting PX: P0 P1 PX P2

        const nearestEdgeIndex =
          _.minBy(
            this.vertices.map((_l, i) => i),
            (i) =>
              minDistance(
                this.vertices[i],
                this.vertices[(i + 1) % this.vertices.length],
                p,
              ),
          ) ?? 0;

        this.vertices.splice(
          (nearestEdgeIndex + 1) % this.vertices.length,
          0,
          this.createVert(p.x, p.y),
        );
      }

      this.createLines(); // TODO: be more efficient
    } else if (button === 0) {
      const tempCircle = new Phaser.Geom.Circle(0, 0, this.vertices[0]?.radius);
      for (const obj of this.vertices) {
        if (tempCircle.setPosition(obj.x, obj.y).contains(x, y)) {
          this.updateSelected(
            this.selectedVerts.includes(obj) ? this.selectedVerts : [obj],
          );

          this.dragging = this.selectedVerts.map((v) => {
            const index = this.vertices.indexOf(v);
            if (index === -1) throw new Error(`Bad selectedVerts item`);
            return {
              obj: v,
              index,
              dx: v.x - x,
              dy: v.y - y,
            };
          });
          return false;
        }
      }
    }
  }

  getLine(i: number) {
    const len = this.lines.length;
    if (len === 0) throw new Error(`Unexpected empty lines`);
    while (i < 0) i += len;
    while (i >= len) i -= len;
    return this.lines[i];
  }
  getVert(i: number) {
    const len = this.vertices.length;
    if (len === 0) throw new Error(`Unexpected empty vertices`);
    while (i < 0) i += len;
    while (i >= len) i -= len;
    return this.vertices[i];
  }

  handlePointerMove(x: number, y: number): boolean | void {
    if (!this.dragging) return;

    const to = { x, y };
    this.scene.snapToGrid(to);

    for (const { obj, dx, dy } of this.dragging) {
      obj.setPosition(to.x + dx, to.y + dy);
    }

    for (const { index } of this.dragging) {
      const a = this.getVert(index - 1);
      const b = this.getVert(index);
      const c = this.getVert(index + 1);
      const ab = this.getLine(index);
      const bc = this.getLine(index + 1);
      ab.setTo(a.x, a.y, b.x, b.y);
      bc.setTo(b.x, b.y, c.x, c.y);
    }
  }

  handlePointerUp(_x: number, _y: number): boolean | void {
    if (!this.dragging) return;

    this.dragging = null;
  }

  destroy() {
    this.createShape(false, true);
    this.unload();

    this.eventManager.off();
  }
}
