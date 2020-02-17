import Phaser from 'phaser';

import { PLAY_TOOL_TYPES, TOOLS } from '../tools';
import { colorInverse, createUIButtons } from '../lib/utils';
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

  setTool(toolType) {
    for (const button of this.toolButtons)
      button.node.classList.toggle(
        'ui-tool-button--active',
        button.getData('tool') === toolType,
      );
  }

  createListeners() {
    this.play.events.on('setSelected', (selected) => {
      const visible = selected && selected.length > 0;
      this.enableObjectActions(visible);
    });
  }

  enableObjectActions(enabled) {
    for (const button of this.objActions)
      button.setVisible(enabled).setActive(enabled);
  }

  create() {
    this.stateText = this.add
      .dom(this.scale.width - 10, 10, 'div')
      .setClassName('ui-text')
      .setOrigin(1, 0);

    this.toolButtons = createUIButtons(
      this,
      PLAY_TOOL_TYPES.map((toolType) => {
        const { label: title, color: bgColor } = TOOLS[toolType];
        return {
          title,
          bgColor,
          color: colorInverse(bgColor),
          data: {
            tool: toolType,
          },
          onClick: () => this.play.tm.setTool(toolType),
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

    this.objActions = createUIButtons(
      this,
      [
        {
          title: 'Duplicate',
          onClick: () => {
            const offset = 10;
            const newObjs = this.play.selected.map((obj) => {
              const newObj = obj.clone();
              newObj.setPosition(obj.x + offset, obj.y + offset);
              newObj.render();
              this.play.parts.add(newObj);

              return newObj;
            });

            this.play.events.emit('setSelected', newObjs);
          },
        },
        {
          title: 'Delete',
          bgColor: theme.red,
          color: colorInverse(theme.red),
          onClick: () => {
            for (const obj of this.play.selected) obj.destroy();
            this.play.events.emit('setSelected', []);
          },
        },
      ],
      false,
      true,
    );
    this.enableObjectActions(false);

    this.flashText = this.add
      .dom(this.scale.width / 2, 0, 'div')
      .setClassName('ui-flash ui-text')
      .setOrigin(0.5, 0);
  }
}
