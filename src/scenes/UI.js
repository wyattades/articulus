import Phaser from 'phaser';

import { TOOL_TYPES, TOOLS } from '../tools';

export default class UI extends Phaser.Scene {
  constructor() {
    super({
      key: 'UI',
      active: true,
    });
  }

  /** @type import('./Play').default */
  play;

  flash(msg, type = 'danger') {
    const cl = this.flashText.setText(msg).node.classList;
    cl.add(`has-text-${type}`);
    cl.remove('animate');
    setTimeout(() => cl.add('animate'), 60);
  }

  create() {
    this.play = this.scene.get('Play');

    this.stateText = this.add
      .dom(this.scale.width - 10, 10, 'div')
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
      button.on('click', () => this.play.setTool(toolType));
      return button;
    });

    this.flashText = this.add
      .dom(this.scale.width / 2, 0, 'div')
      .setClassName('has-text-centered has-text-weight-bold is-size-2')
      .setOrigin(0.5, 0);
    this.flashText.node.id = 'flash';
  }
}
