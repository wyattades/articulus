import Phaser from 'phaser';

import { TOOL_TYPES, TOOLS } from '../tools';

export default class UI extends Phaser.Scene {
  constructor() {
    super({
      key: 'UI',
      active: true,
    });
  }

  create() {
    this.stateText = this.add
      .text(this.game.scale.width - 10, 10, '', {})
      .setOrigin(1, 0);
    // this.uiGroup.add(this.stateText);

    this.toolButtons = TOOL_TYPES.map((toolType, i) => {
      const { label } = TOOLS[toolType];
      const button = this.add
        .dom(10, 10 + i * 30, 'button', null, label)
        .setOrigin(0, 0)
        .setData('tool', toolType)
        .addListener('click');
      button.on('click', () => this.scene.get('Play').setTool(toolType));
      // this.uiGroup.add(button);
      return button;
    });
  }
}
