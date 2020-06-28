import Phaser from 'phaser';

import theme from '../styles/theme';

const ROTATOR_OFFSET = 20;

const canvasStyle = document.querySelector('canvas').style;
const pointerOut = () => {
  canvasStyle.cursor = 'auto';
};
const addHoverCursor = (obj, cursor) => {
  obj
    .on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => {
      canvasStyle.cursor = cursor;
    })
    .on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, pointerOut);
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

  static getBounds(objs) {
    const MAX = 999999;
    let left = MAX,
      top = MAX,
      right = -MAX,
      bottom = -MAX;

    for (const obj of objs) {
      const objX = obj.x - obj.width / 2;
      const objY = obj.y - obj.height / 2;

      if (objX < left) left = objX;
      if (objY < top) top = objY;
      if (objX + obj.width > right) right = objX + obj.width;
      if (objY + obj.height > bottom) bottom = objY + obj.height;
    }

    return {
      left,
      top,
      right,
      bottom,
      width: right - left,
      height: bottom - top,
    };
  }

  updateFromBounds(objs) {
    const b = Controls.getBounds(objs);

    this.setPosition(b.left, b.top, true);
    this.setSize(b.width, b.height, true);
    this.updateChildren();
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
    for (const obj of this.edgeObjs) {
      obj.setPosition(
        this.x + (1 - obj.originX) * this.width,
        this.y + (1 - obj.originY) * this.height,
      );
    }

    this.rotateObj.setPosition(
      this.x + this.width / 2,
      this.y - ROTATOR_OFFSET,
    );

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

    this.borderObj.setPosition(
      this.x + this.width / 2,
      this.y + this.height / 2,
    );
  }

  updateChildrenRotation() {
    // for (const obj of this.getChildren()) {
    //   obj.setRotation(this.rotation);
    // }
  }

  setRotation(r) {
    this.rotation = r;
    this.updateChildrenRotation();
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
    const SIZE = 12;

    this.borderObj = this.scene.add.graphics();
    this.add(this.borderObj);

    this.rotateObj = this.scene.add
      .rectangle(0, 0, SIZE, SIZE, theme.grey)
      .setOrigin(0.5, 0.5)
      .setInteractive();
    addHoverCursor(this.rotateObj, 'pointer');
    this.add(this.rotateObj);

    this.edgeObjs = [];
    for (const [ox, oy, resizeAttr] of [
      [1, 1, 'nw-resize'],
      [0, 1, 'ne-resize'],
      [1, 0, 'sw-resize'],
      [0, 0, 'se-resize'],
    ]) {
      const obj = this.scene.add
        .rectangle(0, 0, SIZE, SIZE, theme.grey)
        .setOrigin(ox, oy)
        .setInteractive();

      addHoverCursor(obj, resizeAttr);

      this.edgeObjs.push(obj);
      this.add(obj);
    }

    this.updateChildren();
  }

  // NOOPs
  saveRender() {}
  rerender() {}
}
