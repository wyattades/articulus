import type Game from 'src/Game';
import type { Part } from 'src/objects';
import type ToolManager from 'src/tools/ToolManager';

export abstract class BaseScene extends Phaser.Scene {
  game!: Game;

  cursor?: Phaser.GameObjects.Sprite;

  parts!: Phaser.GameObjects.Group;

  debugShapes?: Record<
    string,
    Phaser.GameObjects.Rectangle | Phaser.GameObjects.Arc
  >;

  selected?: Part[];

  tm!: ToolManager;

  modifierKey!: Phaser.Input.Keyboard.Key;

  get snappingEnabled() {
    return false;
  }
  snapToGrid(
    _point:
      | Point
      | (Point & {
          originX: number;
          originY: number;
          width: number;
          height: number;
        }),
  ): boolean {
    return false;
  }

  getParts() {
    return this.parts.getChildren() as unknown as Part[];
  }

  showFlash(message: string) {
    this.events.emit('showFlash', message);
  }

  deleteSelected() {
    this.tm.getTool('select')?.deleteSelected();
  }

  abstract shutdown(): void;

  // physics are running
  get running() {
    return false;
  }
}
