import Phaser from 'phaser';

import { stiffConnect } from '../lib/physics';
import { Line } from '../objects';
import Tool from './Tool';

export default class LineTool extends Tool {
  drawLine = null;

  activateDrawLine() {
    let line = null;
    if (this.drawLine) {
      // if (this.tool) {
      line = this.drawLine.line.enablePhysics();
      // } else this.drawLine.line.destroy();
      this.drawLine = null;
    }
    return line;
  }

  handlePointerDown(x, y) {
    const lineExisted = this.activateDrawLine();

    if (!lineExisted) {
      const line = new this.PartClass(this.scene, x, y, x, y);
      line.render();
      this.drawLine = { x, y, line };
      this.scene.parts.add(line);
      if (this.scene.cursor.visible) {
        line.setData('connectStartData', {
          x: this.scene.cursor.x,
          y: this.scene.cursor.y,
          obj: this.scene.cursor.getData('connectObj'),
        });
      }
    }
  }

  handleMove(x, y) {
    if (this.drawLine) {
      this.drawLine.line.setEnd(x, y);
    }
  }

  intersectsOtherWood(line) {
    if (line.type !== 'wood') return null;
    const lineGeom = new Phaser.Geom.Line(line.x1, line.y1, line.x2, line.y2);
    for (const obj of this.scene.parts.getChildren())
      if (obj.type === 'wood' && obj.collides(lineGeom)) return obj;
    return null;
  }

  handlePointerUp(x, y) {
    const line = this.activateDrawLine();
    if (line) {
      const startData = line.getData('connectStartData');
      const start = startData && startData.obj;
      const end =
        this.scene.cursor.visible && this.scene.cursor.getData('connectObj');

      if (start === end || line.length < Line.MIN_LENGTH) {
        line.destroy();
        return;
      }

      const intersected = this.intersectsOtherWood(line);
      if (intersected && intersected !== start && intersected !== end) {
        line.destroy();
        return;
      }

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

      this.scene.refreshCursor(x, y);
    }
  }
}
