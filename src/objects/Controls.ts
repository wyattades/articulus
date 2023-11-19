import Phaser from 'phaser';

import { RotatedRect } from 'lib/rotatedRect';
import { factoryRotateAround } from 'lib/utils';
import { addHoverCursor, getObjectsBounds } from 'lib/utils/phaser';
import { config } from 'src/const';
import type Part from 'src/objects/Part';
import type { BaseScene } from 'src/scenes/Scene';
import { COLORS } from 'src/styles/theme';

const ROTATOR_OFFSET = 20 * config.gameScale;
const ANCHOR_SIZE = 12 * config.gameScale;

type POffset = {
  lx: number;
  ly: number;
  dx: number;
  dy: number;
};

type ControlsChild =
  | (Phaser.GameObjects.Shape & { poffset: POffset })
  | (Phaser.GameObjects.Graphics & { poffset: POffset });

export default class Controls extends Phaser.GameObjects.Group {
  x = 0;
  y = 0;
  width = 1;
  height = 1;
  rotation = 0;

  edgeObjs!: (Phaser.GameObjects.Rectangle & { poffset: POffset })[];
  rotateObj!: Phaser.GameObjects.Rectangle & { poffset: POffset };
  borderObj!: Phaser.GameObjects.Graphics & { poffset: POffset };

  constructor(scene: BaseScene) {
    super(scene);
    this.scene.add.existing(this);
    this.initChildren();
    this.setVisible(false);
  }

  updateFromBounds(objs: Part[]) {
    if (objs.length === 1) {
      const obj = objs[0];
      // TODO: use .originX instead of 0.5? (idk, originX/originY are modified when a texture is created)
      this.setPosition(obj.x - obj.width * 0.5, obj.y - obj.height * 0.5, true);
      this.setSize(obj.width, obj.height, true);
      this.setRotation(obj.rotation, true);
    } else {
      const b = getObjectsBounds(objs);
      if (b) {
        this.setPosition(b.left, b.top, true);
        this.setSize(b.width, b.height, true);
        this.setRotation(0, true);
      }
    }
    this.updateChildren();
  }

  /**
   * Just updates Controls's bounding box and position
   */
  setSelected(selected: Part[]) {
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

    for (const obj of this.getChildren() as ControlsChild[]) {
      const p = rotateAround({
        x: this.width * obj.poffset.lx + obj.poffset.dx + center.x,
        y: this.height * obj.poffset.ly + obj.poffset.dy + center.y,
      });

      obj.setPosition(p.x, p.y);
      obj.setRotation(this.rotation);
    }
  }

  setRotation(r: number, noUpdate = false) {
    this.rotation = r;
    if (!noUpdate) this.updateChildrenRotation();
    return this;
  }

  setSize(w: number, h: number, noUpdate = false) {
    this.width = w;
    this.height = h;
    if (!noUpdate) this.updateChildren();
    return this;
  }

  setPosition(x: number, y: number, noUpdate = false) {
    this.x = x;
    this.y = y;
    if (!noUpdate) this.updateChildren();
    return this;
  }

  updateFromCorners(oppCorner: Point, obj: Phaser.GameObjects.Shape) {
    const rect = RotatedRect.fromCorners(
      oppCorner,
      obj,
      obj.originX as 0 | 1,
      obj.originY as 0 | 1,
      this.rotation,
    );

    this.setPosition(rect.x, rect.y, true);
    this.setSize(rect.width, rect.height, true);
    this.updateChildren();
  }

  initChildren() {
    this.borderObj = Object.assign(this.scene.add.graphics(), {
      poffset: { lx: 0, ly: 0, dy: 0, dx: 0 },
    });
    this.add(this.borderObj);

    this.rotateObj = Object.assign(
      this.scene.add
        .rectangle(0, 0, ANCHOR_SIZE, ANCHOR_SIZE, COLORS.grey)
        .setOrigin(0.5, 0.5)
        .setInteractive(),
      { poffset: { lx: 0, ly: -0.5, dy: -ROTATOR_OFFSET, dx: 0 } },
    );
    addHoverCursor(this.rotateObj, 'grab');
    this.add(this.rotateObj);

    this.edgeObjs = [];
    for (const [ox, oy, resizeAttr] of [
      [1, 1, 'nw-resize'],
      [0, 1, 'ne-resize'],
      [1, 0, 'sw-resize'],
      [0, 0, 'se-resize'],
    ] as const) {
      const obj = Object.assign(
        this.scene.add
          .rectangle(0, 0, ANCHOR_SIZE, ANCHOR_SIZE, COLORS.grey)
          .setOrigin(ox, oy)
          .setInteractive(),
        { poffset: { lx: 0.5 - ox, ly: 0.5 - oy, dx: 0, dy: 0 } },
      );

      addHoverCursor(obj, resizeAttr);

      this.edgeObjs.push(obj);
      this.add(obj);
    }

    this.updateChildren();
  }

  // NOOP
  saveRender() {}
}
