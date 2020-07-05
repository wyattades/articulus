import Phaser from 'phaser';

import { PLAY_TOOL_TYPES, TOOLS } from '../tools';
import { colorInverse, createUIButtons, getObjectsBounds } from '../lib/utils';
import theme from '../styles/theme';
import { clonePhysics } from '../lib/physics';
import { MAX_PARTS } from '../const';

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

  updatePointer(x, y) {
    this.pointerPosText.setText(`x: ${Math.round(x)}, y: ${Math.round(y)}`);
  }

  createListeners() {
    this.play.events.on('setSelected', (selected) => {
      const visible = selected && selected.length > 0;
      this.enableObjectActions(visible);
    });

    if (this.pointerPosText)
      this.play.input.on('pointermove', ({ worldX, worldY }) =>
        this.updatePointer(worldX, worldY),
      );
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

    if (localStorage.getItem('fc:debug')) {
      this.pointerPosText = this.add
        .dom(this.scale.width - 10, this.scale.height - 10, 'div')
        .setClassName('ui-text')
        .setOrigin(1, 1);
    }

    // show FPS stats at the top right
    import('stats.js').then(({ default: Stats }) => {
      this.stats = new Stats();
      this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom

      this.stats.dom.style.right = 0;
      this.stats.dom.style.left = 'auto';
      document.body.appendChild(this.stats.dom);
    });
    this.events.on('shutdown', () => {
      this.stats.dom.remove();
      this.stats = null;
    });

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
            if (
              this.play.parts.getLength() + this.play.selected.length >
              MAX_PARTS
            ) {
              this.flash('MAX ITEM LIMIT EXCEEDED');
              return;
            }

            const bounds = getObjectsBounds(this.play.selected);

            const newObjs = this.play.selected.map((obj) => {
              const newObj = obj.clone();
              // TODO: let user click where they want to "paste" the duplicates
              newObj.setPosition(obj.x + bounds.width + 40, obj.y);
              this.play.parts.add(newObj);

              return newObj;
            });

            clonePhysics(this.play, this.play.selected, newObjs);

            for (const obj of newObjs) obj.saveRender();

            this.play.events.emit('setSelected', newObjs);

            this.play.refreshCameraFollower();
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

    this.createListeners();
  }
}
