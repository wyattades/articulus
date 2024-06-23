import type StatsJs from 'stats.js';

import type { FlashStatus } from 'components/FlashText';
import type Game from 'src/Game';
import type { Terrain } from 'src/lib/terrain';
import type { ObjectInstance, Part } from 'src/objects';
import type ToolManager from 'src/tools/ToolManager';

export type DebugShapeType =
  | Phaser.GameObjects.Rectangle
  | Phaser.GameObjects.Arc
  | Phaser.GameObjects.Polygon
  | Phaser.GameObjects.Line;

type CursorObj = Phaser.GameObjects.Arc & {
  getData(name: 'connectAnchorJoint'): FC.AnchorJoint;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface ObjectsGroup<T extends Phaser.GameObjects.GameObject | Part>
  extends Omit<Phaser.GameObjects.Group, 'getChildren' | 'add'> {
  getChildren(): T[];
  add(obj: T): this;
}

export abstract class BaseScene extends Phaser.Scene {
  game!: Game;

  cursor?: CursorObj;

  parts!: ObjectsGroup<Part>;

  debugShapes?: Record<string, DebugShapeType>;

  // used by multiple tools e.g. SelectTool
  selected?: Part[];

  tm!: ToolManager;

  modifierKey!: Phaser.Input.Keyboard.Key;

  stats?: StatsJs;

  worldBounds?: Phaser.Geom.Rectangle;
  terrainGroup?: ObjectsGroup<Terrain | Part>;

  activeDrag?: {
    afterPlace?: (x: number, y: number) => void;
    moved?: boolean;
    x: number;
    y: number;
    dragging: {
      obj: Part;
      dx: number;
      dy: number;
      customUpdate?: (obj: Part | ObjectInstance, x: number, y: number) => void;
    }[];
  } | null;

  precheckMaxItems?(count: number): boolean;

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

  get keyboard() {
    return this.input.keyboard!;
  }

  getParts() {
    return this.parts.getChildren() as unknown as Part[];
  }

  showFlash(message: string, status: FlashStatus = 'info') {
    this.events.emit('showFlash', { message, status });
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
