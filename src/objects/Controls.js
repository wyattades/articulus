import Phaser from 'phaser';

import { factoryRotateAround, getObjectsBounds } from 'src/lib/utils';
import theme from 'src/styles/theme';
import { config } from 'src/const';

const ROTATOR_OFFSET = 20 * config.gameScale;
const ANCHOR_SIZE = 12 * config.gameScale;

let canvas;
const setCursor = (cursor) => {
  canvas ||= document.querySelector('canvas');
  if (canvas) canvas.style.cursor = cursor;
};

const addHoverCursor = (obj, cursor) => {
  obj
    .on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => {
      setCursor(cursor);
    })
    .on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
      setCursor('auto');
    });
};

export default class Controls extends Phaser.GameObjects.Group {
  x = 0;
  y = 0;
  width = 1;
  height = 1;
  rotation = 0;

  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    super(scene);
    this.scene.add.existing(this);
    this.initChildren();
    this.setVisible(false);
  }

  /**
   * @param {Phaser.GameObjects.GameObject[]} objs
   */
  updateFromBounds(objs) {
    if (objs.length === 1) {
      const obj = objs[0];
      this.setPosition(obj.x - obj.width / 2, obj.y - obj.height / 2, true);
      this.setSize(obj.width, obj.height, true);
      this.setRotation(obj.rotation, true);

      this.updateChildren();
    } else {
      const b = getObjectsBounds(objs);

      this.setPosition(b.left, b.top, true);
      this.setSize(b.width, b.height, true);
      this.setRotation(0, true);

      this.updateChildren();
    }
  }

  /**
   * Just updates Controls's bounding box and position
   * @param {Phaser.GameObjects.GameObject[]} selected
   */
  setSelected(selected) {
    if (selected?.length) {
      this.updateFromBounds(selected);

      this.setVisible(true);
    } else {
      this.setVisible(false);
    }
  }

  updateChildren() {
    this.borderObj.clear();
    this.borderObj.lineStyle(1, theme.white, 1);
    this.borderObj.strokeRect(
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height,
    );
    this.borderObj.lineBetween(
      0,
      -this.height / 2,
      0,
      -this.height / 2 - ROTATOR_OFFSET,
    );

    this.updateChildrenRotation();
  }

  rotatePoint(point, center, cos, sin) {
    const px = this.width * point.poffset.lx + point.poffset.dx,
      py = this.height * point.poffset.ly + point.poffset.dy;
    const rotatedX = cos * px - sin * py + center.x;
    const rotatedY = sin * px + cos * py + center.y;

    point.setPosition(rotatedX, rotatedY);
  }

  updateChildrenRotation() {
    const center = { x: this.x + this.width / 2, y: this.y + this.height / 2 };
    const rotateAround = factoryRotateAround(center, this.rotation);

    for (const obj of this.getChildren()) {
      const p = rotateAround({
        x: this.width * obj.poffset.lx + obj.poffset.dx + center.x,
        y: this.height * obj.poffset.ly + obj.poffset.dy + center.y,
      });

      obj.setPosition(p.x, p.y);
      obj.setRotation(this.rotation);
    }
  }

  setRotation(r, noUpdate = false) {
    this.rotation = r;
    if (!noUpdate) this.updateChildrenRotation();
    return this;
  }

  setSize(w, h, noUpdate = false) {
    this.width = w;
    this.height = h;
    if (!noUpdate) this.updateChildren();
    return this;
  }

  setPosition(x, y, noUpdate = false) {
    this.x = x;
    this.y = y;
    if (!noUpdate) this.updateChildren();
    return this;
  }

  updateFrom(obj) {
    // This won't work for non-corner edgeObjs
    const x1 = obj.x;
    const x2 = this.x + this.width * obj.originX;
    const y1 = obj.y;
    const y2 = this.y + this.height * obj.originY;

    this.setPosition(Math.min(x1, x2), Math.min(y1, y2), true);
    this.setSize(Math.abs(x2 - x1), Math.abs(y2 - y1), true);
    this.updateChildren();
  }

  initChildren() {
    this.borderObj = this.scene.add.graphics();
    this.add(this.borderObj);
    this.borderObj.poffset = { lx: 0, ly: 0, dy: 0, dx: 0 };

    this.rotateObj = this.scene.add
      .rectangle(0, 0, ANCHOR_SIZE, ANCHOR_SIZE, theme.grey)
      .setOrigin(0.5, 0.5)
      .setInteractive();
    addHoverCursor(this.rotateObj, 'pointer');
    this.add(this.rotateObj);
    this.rotateObj.poffset = { lx: 0, ly: -0.5, dy: -ROTATOR_OFFSET, dx: 0 };

    this.edgeObjs = [];
    for (const [ox, oy, resizeAttr] of [
      [1, 1, 'nw-resize'],
      [0, 1, 'ne-resize'],
      [1, 0, 'sw-resize'],
      [0, 0, 'se-resize'],
    ]) {
      const obj = this.scene.add
        .rectangle(0, 0, ANCHOR_SIZE, ANCHOR_SIZE, theme.grey)
        .setOrigin(ox, oy)
        .setInteractive();

      obj.poffset = { lx: 0.5 - ox, ly: 0.5 - oy, dx: 0, dy: 0 };

      addHoverCursor(obj, resizeAttr);

      this.edgeObjs.push(obj);
      this.add(obj);
    }

    this.updateChildren();
  }

  // NOOP
  saveRender() {}
}
