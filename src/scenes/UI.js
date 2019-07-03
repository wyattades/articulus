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

  flash(msg, type = 'error') {
    this.flashText.setText(msg).node.classList.add('has-text-danger');

    // TODO clear flashTween and restart
    if (this.flashTween) return;

    this.flashTween = this.add.tween({
      targets: this.flashText,
      y: 30,
      alpha: 1,
      duration: 400,
      ease: Phaser.Math.Easing.Elastic.InOut,
      onComplete: () => {
        this.flashTween = setTimeout(() => {
          this.flashTween = this.add.tween({
            targets: this.flashText,
            y: -30,
            alpha: 0,
            duration: 400,
            ease: Phaser.Math.Easing.Elastic.InOut,
            onComplete: () => {
              this.flashTween = null;
            },
          });
        }, 2000);
      },
    });
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
      .dom(this.scale.width / 2, -30, 'div')
      .setClassName('has-text-centered has-text-weight-bold')
      .setOrigin(0.5, 0);
  }
}
