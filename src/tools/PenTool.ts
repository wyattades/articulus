import Flatten from '@flatten-js/core';

import { EventManager } from 'src/lib/utils';
import { Polygon } from 'src/objects/Polygon';

import Tool from './Tool';

// example of concave: 1 176 23 47 145 1 151 59 79 87 115 176 274 259 304 169 201 47 248 11 397 183 363 319 175 313 1 176
// example of convex: 0 143 0 92 110 140 244 4 330 0 458 12 574 18 600 79 594 153 332 152 107 157

export default class PenTool extends Tool {
  eventManager = new EventManager()
    .on(this.scene.input.keyboard, 'keydown-ESC', () =>
      this.cancelPendingPath(),
    )
    .on(this.scene.input.keyboard, 'keydown-ENTER', () =>
      this.closePendingPath(),
    );

  createShape(points: Point[]) {
    if (this.pending.points.length < 3) {
      this.scene.events.emit('showFlash', 'Not enough points!');

      return;
    }

    const fpoly = new Flatten.Polygon(points.map((p) => [p.x, p.y]));

    // TODO
    if (!fpoly.isValid()) {
      this.scene.events.emit('showFlash', 'Invalid polygon!');
      return;
    }

    for (const poly of fpoly.splitToIslands()) {
      const shape = new Polygon(this.scene);
      shape.polygon.setTo(poly.vertices);

      shape.localizePoints();

      this.scene.parts.add(shape as any);

      shape.rerender();
    }
  }

  pending: {
    points: Point[];
    objs: Phaser.GameObjects.Shape[];
    pendingLine: Phaser.GameObjects.Line;
  } | null = null;

  handlePointerDown(x: number, y: number): boolean | void {
    if (!this.pending) {
      this.pending = {
        points: [],
        objs: [],
        pendingLine: this.scene.add
          .line(0, 0, 0, 0, 0, 0, 0xcccccc)
          .setOrigin(0, 0),
      };

      this.scene.events.emit('polygon:start');
    } else {
      this.scene.events.emit('polygon:createPoint');
    }

    const next = { x, y };

    this.scene.snapToGrid(next);

    const samePoint = this.pending.points.find(
      (p) => Phaser.Math.Distance.BetweenPointsSquared(next, p) < 4,
    );
    if (samePoint) {
      this.closePendingPath();
      return;
    }

    this.pending.objs.push(this.scene.add.circle(next.x, next.y, 4, 0x44ff00));

    if (this.pending.points.length > 0) {
      const prev = this.pending.points[this.pending.points.length - 1];
      this.pending.objs.push(
        this.scene.add
          .line(0, 0, prev.x, prev.y, next.x, next.y, 0xffffff)
          .setOrigin(0, 0),
      );
    }

    this.pending.points.push(next);

    this.pending.pendingLine.setVisible(false);
  }

  handlePointerMove(x: number, y: number): boolean | void {
    if (!this.pending) return;
    const from = this.pending.points[this.pending.points.length - 1];

    const to = { x, y };
    this.scene.snapToGrid(to);

    this.pending.pendingLine.setTo(from.x, from.y, to.x, to.y).setVisible(true);
  }

  closePendingPath() {
    if (!this.pending) return;

    this.createShape(this.pending.points);

    this.cancelPendingPath();
  }

  cancelPendingPath() {
    if (!this.pending) return;

    while (this.pending.objs.length > 0) this.pending.objs.pop().destroy();
    this.pending.pendingLine?.destroy();

    this.pending = null;

    this.scene.events.emit('polygon:end');
  }

  destroy() {
    this.eventManager.off();
  }
}
