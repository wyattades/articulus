import Phaser from 'phaser';

import { TOOL_TYPES, TOOLS } from '../tools';
import { colorIntToHex, colorInverse, createUIButtons } from '../lib/utils';
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

    this.toolButtons = createUIButtons(
      this,
      TOOL_TYPES.map((toolType) => {
        const { label: title, color: bgColor } = TOOLS[toolType];
        return {
          title,
          bgColor,
          color: colorInverse(bgColor),
          data: {
            tool: toolType,
          },
          onClick: () => this.play.setTool(toolType),
        };
      }),
    );

    createUIButtons(
      this,
      [
        {
          title: 'Menu',
          onClick: () => {
            this.game.setScene('Menu');
          },
        },
        {
          title: 'Edit',
          onClick: () => {
            this.game.setScene('Editor', {
              mapKey: this.mapKey,
            });
          },
        },
      ],
      true,
    );

    this.flashText = this.add
      .dom(this.scale.width / 2, 0, 'div')
      .setClassName('ui-flash ui-text')
      .setOrigin(0.5, 0);
  }
}
