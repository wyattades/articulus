import Phaser from 'phaser';

import { EventManager } from 'lib/utils';

import { TOOLS } from '.';

export default class ToolManager {
  tools = []; // active tools

  lastPointer = null;

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

  setTool(toolType) {
    this.destroyTools();

    const types = [...this.topTypes];
    if (toolType === 'select') {
      types.push('drag', 'select');

      if (this.scene.ui.editor) types.unshift('controls');
    } else if (toolType) types.push(toolType);

    this.tools = types.map(
      (type) => new TOOLS[type].ToolClass(this.scene, type),
    );

    // this.scene.events.emit('setTool', toolType);
    this.scene.ui.setTool(toolType);
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
