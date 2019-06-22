import { stiffConnect } from '../lib/physics';
import { Wheel } from '../objects';
import Tool from './Tool';

export default class PlaceTool extends Tool {
  render(x, y) {}
  handlePointerDown(x, y) {
    if (
      !this.scene.cursor.visible ||
      !(this.scene.cursor.getData('connectObj') instanceof Wheel)
    ) {
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
  }
}
