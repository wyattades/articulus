import Phaser from 'phaser';

import { TOOLS, EDITOR_TOOL_TYPES } from '../tools';
import { colorInverse, createUIButtons } from '../lib/utils';

export default class EditorUI extends Phaser.Scene {
  constructor() {
    super({
      key: 'EditorUI',
    });
  }

  init(data) {
    this.mapKey = data.mapKey;

    this.editor = this.scene.get('Editor');
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

  setTool(toolType) {
    for (const button of this.toolButtons)
      button.node.classList.toggle(
        'ui-tool-button--active',
        button.getData('tool') === toolType,
      );
  }

  create() {
    this.pointerPosText = this.add
      .dom(this.scale.width - 10, this.scale.height - 10, 'div')
      .setClassName('ui-text')
      .setOrigin(1, 1);

    this.toolButtons = createUIButtons(
      this,
      EDITOR_TOOL_TYPES.map((toolType) => {
        const { label: title, color: bgColor } = TOOLS[toolType];
        return {
          title,
          bgColor,
          color: colorInverse(bgColor),
          data: {
            tool: toolType,
          },
          onClick: () => this.editor.tm.setTool(toolType),
        };
      }),
    );

    const save = () => {
      let mapKey = this.mapKey;
      if (!mapKey) {
        mapKey = window.prompt('Save key:', '');
        if (mapKey) this.editor.mapSaver.setKey(mapKey);
        else return;
      }
      this.editor.saveLevel(true);
    };

    createUIButtons(
      this,
      [
        {
          title: 'Menu',
          onClick: () => {
            save();

            this.game.setScene('Menu');
          },
        },
        {
          title: 'Play',
          onClick: () => {
            save();

            this.game.setScene('Play', {
              mapKey: this.mapKey,
            });
          },
        },
      ],
      true,
    );

    this.uiSaveStatus = this.add
      .dom(this.scale.width - 10, 10 + 2 * 50, 'div', '', '')
      .setClassName('ui-text')
      .setOrigin(1, 0);

    this.createListeners();

    this.updatePointer(
      this.input.activePointer.worldX,
      this.input.activePointer.worldY,
    );
  }
}
