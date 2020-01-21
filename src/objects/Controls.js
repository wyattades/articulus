import Phaser from 'phaser';

import theme from '../styles/theme';

export default class Controls extends Phaser.GameObjects.Group {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    super(scene);
    this.scene.add.existing(this);
    this.initChildren();
    this.setVisible(false);
  }

  width = 1;
  height = 1;
  // originX = 0;
  // originY = 0;

  static getBounds(objs) {
    const MAX = 999999;
    let minX = MAX,
      minY = MAX,
      maxX = -MAX,
      maxY = -MAX;

    for (const obj of objs) {
      const objX = obj.x - obj.width / 2;
      const objY = obj.y - obj.height / 2;

      if (objX < minX) minX = objX;
      if (objY < minY) minY = objY;
      if (objX + obj.width > maxX) maxX = objX + obj.width;
      if (objY + obj.height > maxY) maxY = objY + obj.height;
    }

    return { minX, minY, maxX, maxY };
  }

  updateFromBounds(objs) {
    const b = Controls.getBounds(objs);

    this.setPosition(b.minX, b.minY, true);
    this.setSize(b.maxX - b.minX, b.maxY - b.minY, true);
    this.updateChildren();
  }

  /**
   * Just updates Controls's bounding box and position
   * @param {Phaser.GameObjects.GameObject[]} selected
   */
  setSelected(selected) {
    if (selected && selected.length > 0) {
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

    this.borderObj.clear();
    this.borderObj.lineStyle(1, theme.white, 1);
    this.borderObj.strokeRect(this.x, this.y, this.width, this.height);
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
    const { scene, width: w, height: h } = this;

    this.borderObj = scene.add.graphics();
    this.add(this.borderObj);

    const canvasStyle = this.scene.game.canvas.style;
    const pointerOut = () => {
      canvasStyle.cursor = 'auto';
    };

    const SIZE = 12;
    this.edgeObjs = [];
    for (const [ox, oy, resizeAttr] of [
      [1, 1, 'nw-resize'],
      [0, 1, 'ne-resize'],
      [1, 0, 'sw-resize'],
      [0, 0, 'se-resize'],
    ]) {
      const obj = scene.add
        .rectangle(w * (1 - ox), h * (1 - oy), SIZE, SIZE, theme.grey)
        .setOrigin(ox, oy)
        .setInteractive();

      obj
        .on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => {
          canvasStyle.cursor = resizeAttr;
        })
        .on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, pointerOut);

      this.edgeObjs.push(obj);
      this.add(obj);
    }

    this.updateChildren();
  }

  render() {}
}
