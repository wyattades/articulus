import Phaser from 'phaser';

import { PLAY_TOOL_TYPES, TOOLS } from 'src/tools';
import {
  colorInverse,
  createUIButton,
  createUIButtons,
  getObjectsBounds,
} from 'lib/utils';
import theme from 'src/styles/theme';
import { clonePhysics } from 'lib/physics';
import { settingsSaver } from 'lib/saver';

export default class UI extends Phaser.Scene {
  constructor() {
    super({
      key: 'UI',
    });
  }

  init() {
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
      this.enableObjectActions(selected?.length);
    });

    if (this.pointerPosText)
      this.play.input.on('pointermove', ({ worldX, worldY }) =>
        this.updatePointer(worldX, worldY),
      );
  }

  enableObjectActions(selectedCount) {
    for (const button of this.objActions)
      button.setActive(!!selectedCount).setVisible(!!selectedCount);

    if (selectedCount) {
      // HACK: this messes up the position of the buttons when set while invisible i.e. synchronously, before Phaser renders
      requestAnimationFrame(() => {
        this.objActions[0].setText(`Duplicate ${selectedCount} selected`);
        this.objActions[1].setText(`Delete ${selectedCount} selected`);
      });
    }
  }

  create() {
    if (settingsSaver.get('debug')) {
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
      this.stats?.dom.remove();
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
      0,
      0,
    );

    const padding = 10;
    this.pauseButton = createUIButton(this, this.scale.width / 2, padding, {
      title: ' ',
      onClick: () => {
        this.play.setRunning(!this.play.running);
      },
    }).setOrigin(0.5, 0);

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
              mapKey: this.play.mapKey,
            });
          },
        },
      ],
      1,
      0,
    );

    this.objActions = createUIButtons(
      this,
      [
        {
          title: 'Duplicate 1 selected',
          onClick: () => {
            if (this.play.precheckMaxItems(this.play.selected.length)) return;

            const bounds = getObjectsBounds(this.play.selected);
            if (!bounds) return;

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
          title: 'Delete 1 selected',
          bgColor: theme.red,
          color: colorInverse(theme.red),
          onClick: () => {
            for (const obj of this.play.selected) obj.destroy();
            this.play.events.emit('setSelected', []);
          },
        },
      ],
      0,
      1,
    );
    this.enableObjectActions(false);

    this.flashText = this.add
      .dom(this.scale.width / 2, this.scale.height, 'div')
      .setClassName('ui-flash ui-text')
      .setOrigin(0.5, 1.0);

    this.createListeners();
  }
}
