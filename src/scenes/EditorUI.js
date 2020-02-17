import Phaser from 'phaser';

import { TOOLS, EDITOR_TOOL_TYPES } from '../tools';
import { colorInverse, createUIButtons } from '../lib/utils';
import theme from '../styles/theme';
import { settingsSaver } from '../lib/saver';

export default class EditorUI extends Phaser.Scene {
  constructor() {
    super({
      key: 'EditorUI',
    });
  }

  init(data) {
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

    this.editor.events.on('setSelected', (selected) => {
      const visible = selected && selected.length > 0;
      this.enableObjectActions(visible);
    });
  }

  setTool(toolType) {
    for (const button of this.toolButtons)
      button.node.classList.toggle(
        'ui-tool-button--active',
        button.getData('tool') === toolType,
      );
  }

  enableObjectActions(enabled) {
    for (const button of this.objActions)
      button.setVisible(enabled).setActive(enabled);
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

    const save = async () => {
      let mapName = this.editor.mapSaver.name;
      if (!mapName) {
        mapName = window.prompt('Enter a map name:', '');
        if (mapName) this.editor.mapSaver.setName(mapName);
        else return;
      }
      await this.editor.saveLevel(true);
    };

    createUIButtons(
      this,
      [
        {
          title: 'Menu',
          onClick: async () => {
            await save();

            this.game.setScene('Menu');
          },
        },
        {
          title: 'Play',
          onClick: async () => {
            await save();

            this.game.setScene('Play', {
              mapKey: this.editor.mapSaver.id,
            });
          },
        },
        {
          title: 'Grid\nSnapping?',
          onClick: () => {
            this.editor.enableSnapping(!settingsSaver.get('snapping'));
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
            const newObjs = this.editor.selected.map((obj) => {
              const newObj = obj.clone();
              newObj.setPosition(obj.x + offset, obj.y + offset);
              newObj.render();
              this.editor.parts.add(newObj);

              return newObj;
            });

            this.editor.events.emit('setSelected', newObjs);
          },
        },
        {
          title: 'Delete',
          bgColor: theme.red,
          color: colorInverse(theme.red),
          onClick: () => {
            for (const obj of this.editor.selected) obj.destroy();
            this.editor.events.emit('setSelected', []);
          },
        },
      ],
      false,
      true,
    );
    this.enableObjectActions(false);

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
