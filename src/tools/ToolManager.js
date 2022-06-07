import Phaser from 'phaser';

import { EventManager } from 'lib/utils';

import { TOOLS, Tool } from '.';

export default class ToolManager {
  /** @type {Tool[]} */
  tools = []; // active tools

  lastPointer = null;

  activeToolType = null;

  /**
   * @param {Phaser.Scene} scene
   * @param {string} initial
   * @param {string[]} topTypes
   */
  constructor(scene, initial, topTypes = []) {
    this.scene = scene;
    this.topTypes = topTypes;

    this.setTool(initial);
    this.createListeners();
  }

  destroyTools() {
    for (const tool of this.tools) tool.destroy();
  }

  destroy() {
    this.destroyTools();
    this.eventManager.off();
  }

  getTool(toolType) {
    return this.tools.find((t) => t.toolKey === toolType);
  }

  setTool(toolType, ...args) {
    this.destroyTools();

    let types;
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
      const ToolClass = TOOLS[type]?.ToolClass;
      if (!ToolClass) throw new Error(`Invalid toolType: ${type}`);
      return new ToolClass(this.scene, type, ...args);
    });

    this.activeToolType = toolType;
    this.scene.events.emit('setTool', toolType);
  }

  pointerDown = (pointer) => {
    this.lastPointer = pointer;

    const { worldX, worldY } = pointer;

    // stop propagation if a tool's handler returns `false`
    for (const tool of this.tools)
      if (tool.handlePointerDown(worldX, worldY, pointer) === false) break;
  };

  pointerMove = (pointer) => {
    this.lastPointer = pointer;

    const { worldX, worldY } = pointer;

    for (const tool of this.tools)
      if (tool.handlePointerMove(worldX, worldY, pointer) === false) break;
  };

  pointerUp = (pointer) => {
    this.lastPointer = pointer;

    const { worldX, worldY } = pointer;

    for (const tool of this.tools)
      if (tool.handlePointerUp(worldX, worldY, pointer) === false) break;
  };

  createListeners() {
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
}
