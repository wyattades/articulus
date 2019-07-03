import { stiffConnect } from '../lib/physics';
import { Wheel, OBJECTS } from '../objects';
import Tool from './Tool';

export default class PlaceTool extends Tool {
  constructor(scene, partType) {
    super(scene);
    this.partType = partType;
  }

  refreshCursor(x, y) {
    const cursor = this.scene.cursor;

    const hovered = this.getHovered(x, y);
    if (hovered) {
      cursor.setPosition(hovered.x, hovered.y);
      cursor.setData('connectObj', hovered.obj);
    }
    if (!!hovered !== cursor.visible) cursor.setVisible(!!hovered);
  }

  handlePointerDown(x, y) {
    const cursor = this.scene.cursor;

    if (cursor.visible) {
      if (cursor.getData('connectObj') instanceof Wheel) return;

      x = cursor.x;
      y = cursor.y;
    }

    const wheel = new OBJECTS[this.partType](this.scene, x, y);
    wheel.render();
    wheel.enablePhysics();
    this.scene.parts.add(wheel);

    if (cursor.visible) {
      stiffConnect(this.scene, cursor.getData('connectObj').body, wheel.body, {
        x: wheel.x,
        y: wheel.y,
      });
    }
    this.refreshCursor(x, y);
  }

  handleMove(x, y) {
    this.refreshCursor(x, y);
  }
}
