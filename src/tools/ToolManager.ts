import Phaser from 'phaser';

import { EventManager } from 'lib/utils/eventManager';
import type { AnyScene } from 'src/scenes';

import type { ExtraArgsForTool, Tool, ToolClassFor, ToolKey } from '.';
import { TOOLS } from '.';

export default class ToolManager {
  tools: Tool[] = []; // active tools

  lastPointer: Phaser.Input.Pointer | null = null;

  activeToolType: ToolKey | null = null;

  eventManager: EventManager;

  constructor(
    readonly scene: AnyScene,
    initial: ToolKey,
    readonly topTypes: ToolKey[] = [],
  ) {
    // @ts-expect-error idk
    this.setTool(initial);

    this.scene.input
      .on(Phaser.Input.Events.POINTER_DOWN, this.pointerDown)
      .on(Phaser.Input.Events.POINTER_MOVE, this.pointerMove)
      .on(Phaser.Input.Events.POINTER_UP, this.pointerUp);

    this.eventManager = new EventManager()
      .on(this.scene.game.canvas, 'mouseleave', () => {
        if (this.lastPointer) this.pointerUp(this.lastPointer);
      })
      .on(window, 'blur', () => {
        if (this.lastPointer) this.pointerUp(this.lastPointer);
      });
  }

  destroyTools() {
    while (this.tools.length > 0) this.tools.shift()!.destroy();
  }

  destroy() {
    this.destroyTools();
    this.eventManager.off();
  }

  getTool<TK extends ToolKey>(toolType: TK) {
    return this.tools.find((t) => t.toolKey === toolType) as
      | InstanceType<ToolClassFor<TK>>
      | undefined;
  }

  setTool<TK extends ToolKey>(toolType: TK, ...args: ExtraArgsForTool<TK>) {
    this.destroyTools();

    let types: ToolKey[];
    if (toolType === 'select') {
      types = [...this.topTypes, 'drag', toolType];

      if (this.scene.scene.key === 'Editor') types.unshift('controls');
    } else if (toolType === 'edit_points') {
      types = [toolType, ...this.topTypes, 'select_points'];
    } else if (toolType) types = [...this.topTypes, toolType];
    else {
      types = [...this.topTypes];
    }

    this.tools = types.map((type) => {
      const toolData = TOOLS[type] || {};
      if (!toolData) throw new Error(`Invalid toolType: ${type}`);
      const { ToolClass } = toolData;

      const tool =
        toolType === type
          ? // @ts-expect-error unknown args
            new ToolClass(this.scene, type, ...args)
          : // @ts-expect-error missing args
            new ToolClass(this.scene, type);

      if ('ShapeClass' in toolData && toolData.ShapeClass)
        tool.ShapeClass = toolData.ShapeClass;

      return tool;
    });

    this.activeToolType = toolType;
    this.scene.events.emit('setTool', toolType);
  }

  pointerDown = (pointer: Phaser.Input.Pointer) => {
    this.lastPointer = pointer;

    const { worldX, worldY } = pointer;

    // stop propagation if a tool's handler returns `false`
    for (const tool of this.tools)
      if (tool.handlePointerDown(worldX, worldY, pointer) === false) break;
  };

  pointerMove = (pointer: Phaser.Input.Pointer) => {
    this.lastPointer = pointer;

    const { worldX, worldY } = pointer;

    for (const tool of this.tools)
      if (tool.handlePointerMove(worldX, worldY, pointer) === false) break;
  };

  pointerUp = (pointer: Phaser.Input.Pointer) => {
    this.lastPointer = pointer;

    const { worldX, worldY } = pointer;

    for (const tool of this.tools)
      if (tool.handlePointerUp(worldX, worldY, pointer) === false) break;
  };
}
