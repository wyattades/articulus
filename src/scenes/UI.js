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
      .dom(this.game.scale.width - 10, 10, 'div')
      .setClassName('has-text-white has-text-weight-bold has-text-right')
      .setOrigin(1, 0);

    this.toolButtons = TOOL_TYPES.map((toolType, i) => {
      const { label, className } = TOOLS[toolType];
      const button = this.add
        .dom(10, 10 + i * 50, 'button', null, label)
        .setClassName(className)
        .setOrigin(0, 0)
        .setData('tool', toolType)
        .addListener('click');
      button.on('click', () => this.scene.get('Play').setTool(toolType));
      return button;
    });
  }
}
