import Phaser from 'phaser';

import { TOOLS } from '../tools';

const TOOL_TYPES = ['rectangle_shape', 'ellipse_shape', 'select', 'delete'];

export default class EditorUI extends Phaser.Scene {
  constructor() {
    super({
      key: 'EditorUI',
      // active: true,
    });
  }

  /** @type import('./Editor').default */
  editor;

  updatePointer(x, y) {
    this.pointerPosText.setText(`x: ${x}, y: ${y}`);
  }

  createListeners() {
    this.input.on('pointermove', ({ worldX, worldY }) =>
      this.updatePointer(worldX, worldY),
    );
    // this.input.on('gameobjectmove', ({ worldX, worldY }) =>
    //   this.updatePointer(worldX, worldY),
    // );
  }

  create() {
    this.editor = this.scene.get('Editor');

    this.pointerPosText = this.add
      .dom(this.scale.width - 10, this.scale.height - 10, 'div')
      .setClassName(
        'has-text-white has-text-weight-bold has-text-right is-family-monospace',
      )
      .setOrigin(1, 1);

    this.toolButtons = TOOL_TYPES.map((toolType, i) => {
      const { label, className } = TOOLS[toolType];
      const button = this.add
        .dom(10, 10 + i * 50, 'button', null, label)
        .setClassName(className)
        .setOrigin(0, 0)
        .setData('tool', toolType)
        .addListener('click');
      button.on('click', () => this.editor.tm.setTool(toolType));
      return button;
    });

    this.createListeners();
    this.updatePointer(
      this.input.activePointer.worldX,
      this.input.activePointer.worldY,
    );
  }
}
