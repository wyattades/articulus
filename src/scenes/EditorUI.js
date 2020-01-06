import Phaser from 'phaser';

import { TOOLS } from '../tools';
import { colorIntToHex, colorInverse } from '../lib/utils';

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
    this.pointerPosText.setText(`x: ${Math.round(x)}, y: ${Math.round(y)}`);
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
      .setClassName('ui-text')
      .setOrigin(1, 1);

    this.toolButtons = TOOL_TYPES.map((toolType, i) => {
      const { label, color } = TOOLS[toolType];
      const button = this.add
        .dom(
          10,
          10 + i * 50,
          'button',
          `background-color: ${colorIntToHex(color)}; color: ${colorInverse(
            color,
          )}`,
          label,
        )
        .setClassName('ui-tool-button')
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
