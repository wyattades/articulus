import { TOOLS } from '.';

export default class ToolManager {
  dragging = null;

  /**
   * @param {Phaser.Scene} scene
   * @param {String[]} types
   * @param {String} [initial]
   */
  constructor(scene, types, initial = types[0]) {
    this.scene = scene;
    this.types = types;

    this.setTool(initial);
    this.createListeners();

    scene.events.once('destroy', () => this.tool.destroy());
  }

  setTool(toolType) {
    if (this.tool) this.tool.destroy();

    const { ToolClass } = TOOLS[toolType];

    // Same tool
    if (this.tool && this.tool.constructor.name === ToolClass.name) return;

    this.tool = new ToolClass(this.scene, toolType);

    // this.scene.events.emit('setTool', toolType);
    for (const button of this.scene.ui.toolButtons)
      button.node.classList.toggle(
        'is-active',
        button.getData('tool') === toolType,
      );
  }

  createListeners() {
    const inp = this.scene.input;
    inp.on('pointerdown', (pointer) => {
      if (this.dragging) {
        this.dragging = null;
        pointer.dragObj = null;
        return;
      }

      const { worldX, worldY, dragObj } = pointer;
      if (dragObj) {
        const selected = this.scene.selected;
        this.dragging = (selected && selected.length
          ? selected
          : [dragObj]
        ).map((obj) => ({
          obj,
          dx: obj.x - worldX,
          dy: obj.y - worldY,
        }));
        pointer.dragObj = null;
        return;
      }

      if (this.tool) this.tool.handlePointerDown(worldX, worldY);
    });

    inp.on('pointermove', ({ worldX, worldY }) => {
      if (this.dragging) {
        for (const { obj, dx, dy } of this.dragging)
          obj.setPosition(worldX + dx, worldY + dy);
        return;
      }
      if (this.tool) this.tool.handlePointerMove(worldX, worldY);
    });

    inp.on('pointerup', ({ worldX, worldY }) => {
      if (this.dragging) {
        this.dragging = null;
        return;
      }
      if (this.tool) this.tool.handlePointerUp(worldX, worldY);
    });

    // inp.on('drag', (_, obj, dragX, dragY) => {
    //   obj.setPosition(dragX, dragY);
    // });
  }

  // destroy() {
  //   this.tool.destroy();
  // }
}
