import Phaser from 'phaser';

import type EditPointsTool from './EditPointsTool';
import SelectTool from './SelectTool';

export default class SelectPointsTool extends SelectTool {
  get setSelectedEvent() {
    return 'setSelectedPoints';
  }

  allowStartOverlapping = true;

  _editPointsTool?: EditPointsTool;
  get editPointsTool() {
    return (this._editPointsTool ||= this.scene.tm.getTool(
      'edit_points',
    ) as EditPointsTool);
  }

  get currentSelected() {
    return this.editPointsTool.selectedVerts;
  }
  set currentSelected(next) {
    this.editPointsTool.selectedVerts = next;
  }

  deleteSelected() {
    this.editPointsTool.deleteSelected();
  }

  // @ts-expect-error Vert != Part
  getBoxIntersections() {
    const vertices = this.editPointsTool.vertices;

    if (this.box.width + this.box.height < 4) {
      const tempCircle = new Phaser.Geom.Circle(0, 0, vertices[0]?.radius);

      for (const v of vertices) {
        if (tempCircle.setPosition(v.x, v.y).contains(this.box.x, this.box.y)) {
          return [v];
        }
      }
      return [];
    } else {
      return vertices.filter((v) => this.box.contains(v.x, v.y));
    }
  }
}
