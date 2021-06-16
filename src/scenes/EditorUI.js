import Phaser from 'phaser';

import { TOOLS, EDITOR_TOOL_TYPES } from 'src/tools';
import { colorInverse, createUIButtons } from 'lib/utils';
import theme from 'src/styles/theme';
import { settingsSaver } from 'lib/saver';

export default class EditorUI extends Phaser.Scene {
  constructor() {
    super({
      key: 'EditorUI',
    });
  }

  init(data) {
    this.editor = this.scene.get('Editor');
  }

  /** @type {import('./Editor').default} */
  editor;
  /** @type {Phaser.GameObjects.DOMElement[]} */
  objActions;

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
      this.enableObjectActions(selected?.length);
    });
  }

  setTool(toolType) {
    for (const button of this.toolButtons)
      button.node.classList.toggle(
        'ui-tool-button--active',
        button.getData('tool') === toolType,
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
      1,
      0,
    );

    this.objActions = createUIButtons(
      this,
      [
        {
          title: 'Duplicate 1 selected',
          onClick: () => {
            const offset = 10;
            const newObjs = this.editor.selected.map((obj) => {
              const newObj = obj.clone();
              newObj.setPosition(obj.x + offset, obj.y + offset);
              this.editor.parts.add(newObj);

              return newObj;
            });

            this.editor.events.emit('setSelected', newObjs);
          },
        },
        {
          title: 'Delete 1 selected',
          bgColor: theme.red,
          color: colorInverse(theme.red),
          onClick: () => {
            for (const obj of this.editor.selected) obj.destroy();
            this.editor.events.emit('setSelected', []);
          },
        },
      ],
      0,
      1,
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
