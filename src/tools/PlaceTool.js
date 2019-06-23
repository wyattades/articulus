import { stiffConnect } from '../lib/physics';
import { Wheel } from '../objects';
import Tool from './Tool';

const ignoreWheels = (obj) => obj instanceof Wheel;

export default class PlaceTool extends Tool {
  refreshCursor(x, y) {
    const hovered = this.getHovered(x, y, ignoreWheels);
    if (hovered) {
      this.scene.cursor.setPosition(hovered.x, hovered.y);
      this.scene.cursor.setData('connectObj', hovered.obj);
    }
    if (!!hovered !== this.scene.cursor.visible)
      this.scene.cursor.setVisible(!!hovered);
  }

  handlePointerDown(x, y) {
    if (this.scene.cursor.visible) {
      x = this.scene.cursor.x;
      y = this.scene.cursor.y;
    }

    const wheel = new this.PartClass(this.scene, x, y);
    wheel.render();
    wheel.enablePhysics();
    this.scene.parts.add(wheel);

    if (this.scene.cursor.visible) {
      stiffConnect(
        this.scene,
        this.scene.cursor.getData('connectObj').body,
        wheel.body,
        {
          x: wheel.x,
          y: wheel.y,
        },
      );
    }
  }

  handleMove(x, y) {
    this.refreshCursor(x, y);
  }
}
