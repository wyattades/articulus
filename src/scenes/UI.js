import Phaser from 'phaser';

import { TOOL_TYPES, TOOLS } from '../tools';
import { colorIntToHex, colorInverse } from '../lib/utils';
import theme from '../styles/theme';

export default class UI extends Phaser.Scene {
  constructor() {
    super({
      key: 'UI',
    });
  }

  init(data) {
    this.mapKey = data.mapKey;

    this.play = this.scene.get('Play');
  }

  /** @type import('./Play').default */
  play;

  flash(msg, color = theme.red) {
    const cl = this.flashText.setText(msg).node.classList;
    this.flashText.node.style.color = color; // TODO: this gets overridden
    cl.remove('animate');
    setTimeout(() => cl.add('animate'), 60);
  }

  create() {
    this.stateText = this.add
      .dom(this.scale.width - 10, 10, 'div')
      .setClassName('ui-text')
      .setOrigin(1, 0);

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
        .setOrigin(0, 0)
        .setClassName('ui-tool-button')
        .setData('tool', toolType)
        .addListener('click');

      button.on('click', () => this.play.setTool(toolType));
      return button;
    });

    [
      [
        'Menu',
        () => {
          this.game.setScene('Menu');
        },
      ],
      [
        'Edit',
        () => {
          this.game.setScene('Editor', {
            mapKey: this.mapKey,
          });
        },
      ],
    ].forEach(([name, onClick], i) => {
      this.add
        .dom(
          this.scale.width - 10,
          10 + i * 50,
          'button',
          `background-color: ${colorIntToHex(
            theme.white,
          )}; color: ${colorIntToHex(theme.black)}`,
          name,
        )
        .setClassName('ui-tool-button')
        .setOrigin(1, 0)
        .addListener('click')
        .on('click', onClick);
    });

    this.flashText = this.add
      .dom(this.scale.width / 2, 0, 'div')
      .setClassName('ui-flash ui-text')
      .setOrigin(0.5, 0);
  }
}
