import Phaser from 'phaser';

import { stiffConnect } from '../lib/physics';
import Line from '../objects/Line';
import { OBJECTS } from '../objects';
import Tool from './Tool';

export default class LineTool extends Tool {
  drawLine = null;

  constructor(scene, partType) {
    super(scene);
    this.partType = partType;
  }

  ignoreSelf = (obj) => this.drawLine && obj === this.drawLine.line;

  refreshCursor(x, y) {
    const hovered = this.getHovered(x, y, this.ignoreSelf);
    if (hovered) {
      this.scene.cursor.setPosition(hovered.x, hovered.y);
      this.scene.cursor.setData('connectObj', hovered.obj);
    }
    if (!!hovered !== this.scene.cursor.visible)
      this.scene.cursor.setVisible(!!hovered);
    return hovered;
  }

  activateDrawLine(destroy = false) {
    let drawLine = null;
    if (this.drawLine) {
      drawLine = this.drawLine;
      this.drawLine = null;

      if (destroy) drawLine.line.destroy();
      else {
        const { line, startData } = drawLine;

        const start = startData && startData.obj;
        const end =
          this.scene.cursor.visible && this.scene.cursor.getData('connectObj');

        if (start === end || line.length < Line.MIN_LENGTH) {
          line.destroy();
          return drawLine;
        }

        const intersected = this.intersectsOtherWood(line);
        if (intersected && intersected !== start && intersected !== end) {
          line.destroy();
          return drawLine;
        }

        line.enablePhysics();

        if (start)
          stiffConnect(this.scene, start.body, line.body, {
            x: startData.x,
            y: startData.y,
          });
        if (end)
          stiffConnect(this.scene, end.body, line.body, {
            x: this.scene.cursor.x,
            y: this.scene.cursor.y,
          });
      }
    }

    return drawLine;
  }

  handlePointerDown(x, y) {
    const lineExisted = this.activateDrawLine(true);

    if (!lineExisted) {
      if (this.scene.cursor.visible) {
        x = this.scene.cursor.x;
        y = this.scene.cursor.y;
      }

      const line = new OBJECTS[this.partType](this.scene, x, y, x, y);
      line.render();
      this.drawLine = { x, y, line };
      this.scene.parts.add(line);
      if (this.scene.cursor.visible) {
        this.drawLine.startData = {
          x,
          y,
          obj: this.scene.cursor.getData('connectObj'),
        };
      }
    }
  }

  handleMove(x, y) {
    const jointPoint = this.refreshCursor(x, y);
    if (this.drawLine) {
      if (jointPoint) {
        x = jointPoint.x;
        y = jointPoint.y;
      }
      this.drawLine.line.setEnd(x, y);
    }
  }

  intersectsOtherWood(line) {
    if (line.constructor.type !== 'wood') return null;
    const lineGeom = new Phaser.Geom.Line(line.x1, line.y1, line.x2, line.y2);
    for (const obj of this.scene.parts.getChildren())
      if (obj.constructor.type === 'wood' && obj.intersects(lineGeom)) return obj;
    return null;
  }

  handlePointerUp(x, y) {
    if (this.activateDrawLine()) {
      this.refreshCursor(x, y);
    }
  }
}
