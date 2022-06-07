import * as _ from 'lodash-es';
import Flatten from '@flatten-js/core';

import { EventManager } from 'src/lib/utils';
import { Polygon } from 'src/objects/Polygon';
import type { BaseScene } from 'src/scenes/Scene';
import { minDistance } from 'src/lib/minDistance';

import Tool from './Tool';

export default class EditPointsTool extends Tool {
  eventManager = new EventManager()
    .on(this.scene.input.keyboard, 'keydown-ESC', () => {
      this.createShape(true, true);
      this.unload();
    })
    .on(this.scene.input.keyboard, 'keydown-ENTER', () => {
      this.createShape(true, false);
      this.unload();
    })
    .on(this.scene.input.keyboard, 'keydown-DELETE', () =>
      this.deleteSelected(),
    )
    .on(this.scene.input.keyboard, 'keydown-BACKSPACE', () =>
      this.deleteSelected(),
    );

  vertices: Phaser.GameObjects.Arc[];
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
    return this.scene.add.circle(x, y, 5, 0xff0000).setDepth(1);
  }

  createLines() {
    const points = this.vertices;

    while (this.lines.length > 0) this.lines.pop().destroy();

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
    while (this.vertices.length > 0) this.vertices.pop().destroy();
    while (this.lines.length > 0) this.lines.pop().destroy();
  }

  // make sure to call `unload()` at the end of this method
  createShape(setTool: boolean, revertToOriginal: boolean) {
    if (this.unloaded) return;
    this.unloaded = true;

    const points = revertToOriginal ? this.originalPoints : this.vertices;

    if (points.length < 3) {
      this.scene.events.emit('showFlash', 'Not enough points!');

      if (setTool) this.scene.tm.setTool('polygon_shape');
      return;
    }

    const fpoly = new Flatten.Polygon(points.map((p) => [p.x, p.y]));

    if (!fpoly.isValid()) {
      this.scene.events.emit('showFlash', 'Invalid polygon!');

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

  dragging: {
    obj: Phaser.GameObjects.Arc;
    lineTo: Phaser.GameObjects.Line;
    lineFrom: Phaser.GameObjects.Line;
    // dx: number;
    // dy: number;
  } | null = null;

  selected: number | null = null;
  setSelected(index: number | null) {
    if (this.selected != null) {
      const prevSelected = this.vertices[this.selected];
      prevSelected.setStrokeStyle(0, 0, 0);
    }
    if (index != null && this.selected !== index) {
      const obj = this.vertices[index];
      obj.setStrokeStyle(2, 0xffffff, 1);
    }
    this.selected = index;
  }

  deleteSelected() {
    const index = this.selected;
    if (index == null) return;

    this.selected = null;

    // example:
    //   original: --L0-- P0 --L1-- P1 --L2-- P2
    //   after deleting P1: --L0-- P0 --L2-- P2

    const obj = this.vertices[index];
    obj.destroy();
    this.vertices.splice(index, 1);

    const l = this.lines[(index + 1) % this.lines.length];
    const a = this.vertices[(index - 1) % this.vertices.length];
    l.setTo(
      a.x,
      a.y,
      (l.geom as Phaser.Geom.Line).x2,
      (l.geom as Phaser.Geom.Line).y2,
    );

    this.lines[index].destroy();
    this.lines.splice(index, 1);
  }

  handlePointerDown(
    x: number,
    y: number,
    { button }: Phaser.Input.Pointer,
  ): boolean | void {
    if (button === 2) {
      this.setSelected(null);

      const p = { x, y };
      this.scene.snapToGrid(p);

      // example:
      //   original: P0 --Dist0-- P1 --Dist1-- P2
      //   let Dist1 be the smallest
      //   after inserting PX: P0 P1 PX P2

      const nearestEdgeIndex = _.minBy(
        this.vertices.map((_l, i) => i),
        (i) =>
          minDistance(
            this.vertices[i],
            this.vertices[(i + 1) % this.vertices.length],
            p,
          ),
      );
      this.vertices.splice(
        (nearestEdgeIndex + 1) % this.vertices.length,
        0,
        this.createVert(p.x, p.y),
      );

      this.createLines(); // TODO: be more efficient
    } else if (button === 0) {
      const tempCircle = new Phaser.Geom.Circle(0, 0, this.vertices[0]?.radius);

      for (let i = 0, len = this.vertices.length; i < len; i++) {
        const obj = this.vertices[i];
        if (tempCircle.setPosition(obj.x, obj.y).contains(x, y)) {
          this.dragging = {
            obj,
            lineTo: this.lines[i],
            lineFrom: this.lines[(i + 1) % this.lines.length],
          };
          this.setSelected(i);
          return false;
        }
      }
      this.setSelected(null);
    }
  }

  handlePointerMove(x: number, y: number): boolean | void {
    if (!this.dragging) return;

    const { obj, lineFrom, lineTo } = this.dragging;

    const to = { x, y };
    this.scene.snapToGrid(to);

    obj.setPosition(to.x, to.y);

    lineFrom.setTo(to.x, to.y, lineFrom.geom.x2, lineFrom.geom.y2);
    lineTo.setTo(lineTo.geom.x1, lineTo.geom.y1, to.x, to.y);
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
