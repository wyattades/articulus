import Phaser from 'phaser';

import {
  addHoverCursor,
  factoryRotateAround,
  getObjectsBounds,
} from 'src/lib/utils';
import { COLORS } from 'src/styles/theme';
import { config } from 'src/const';
import { RotatedRect } from 'src/lib/rotatedRect';

import Part from './Part';

const ROTATOR_OFFSET = 20 * config.gameScale;
const ANCHOR_SIZE = 12 * config.gameScale;

export default class Controls extends Phaser.GameObjects.Group {
  x = 0;
  y = 0;
  width = 1;
  height = 1;
  rotation = 0;

  /** @type {Phaser.GameObjects.Rectangle[]} */
  edgeObjs;
  /** @type {Phaser.GameObjects.Rectangle} */
  rotateObj;

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

  /**
   * @param {Point} oppCorner
   * @param {Phaser.GameObjects.Shape} obj
   */
  updateFromCorners(oppCorner, obj) {
    const rect = RotatedRect.fromCorners(
      oppCorner,
      obj,
      obj.originX,
      obj.originY,
      this.rotation,
    );

    this.setPosition(rect.x, rect.y, true);
    this.setSize(rect.width, rect.height, true);
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
