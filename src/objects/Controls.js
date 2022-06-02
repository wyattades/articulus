import Phaser from 'phaser';

import { factoryRotateAround, getObjectsBounds } from 'src/lib/utils';
import { COLORS } from 'src/styles/theme';
import { config } from 'src/const';

import Part from './Part';

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
   * @param {Part[]} objs
   */
  updateFromBounds(objs) {
    if (objs.length === 1) {
      const obj = objs[0];
      // TODO: use .originX instead of 0.5? (idk, originX/originY are modified when a texture is created)
      this.setPosition(obj.x - obj.width * 0.5, obj.y - obj.height * 0.5, true);
      this.setSize(obj.width, obj.height, true);
      this.setRotation(obj.rotation, true);
    } else {
      const b = getObjectsBounds(objs);

      this.setPosition(b.left, b.top, true);
      this.setSize(b.width, b.height, true);
      this.setRotation(0, true);
    }
    this.updateChildren();
  }

  /**
   * Just updates Controls's bounding box and position
   * @param {Part[]} selected
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
    this.borderObj.lineStyle(1, COLORS.white, 1);
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
    // NOTE: This won't work for non-corner edgeObjs

    // point 1: this object's corner
    const x1 = obj.x;
    const y1 = obj.y;

    // point 2: the opposite corner from point 1
    const x2 = this.x + this.width * obj.originX;
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
      .rectangle(0, 0, ANCHOR_SIZE, ANCHOR_SIZE, COLORS.grey)
      .setOrigin(0.5, 0.5)
      .setInteractive();
    addHoverCursor(this.rotateObj, 'grab');
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
        .rectangle(0, 0, ANCHOR_SIZE, ANCHOR_SIZE, COLORS.grey)
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
