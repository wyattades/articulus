import Phaser from 'phaser';

import { MapSaver } from '../lib/saver';

export default class Menu extends Phaser.Scene {
  constructor() {
    super({
      key: 'Menu',
    });
  }

  async loadLevels() {
    this.levels = [...(await MapSaver.loadLevelsMeta())];
    return this.levels;
  }

  async create() {
    this.add
      .dom(this.scale.width / 2, 10, 'div', '', 'Select a level:')
      .setClassName('ui-text')
      .setOrigin(0.5, 0);

    this.add
      .dom(10, 10, 'div', '', 'New Level')
      .setClassName('ui-tool-button')
      .addListener('click')
      .setOrigin(0, 0)
      .on('click', () => {
        this.game.setScene('Editor');
      });

    this.add
      .dom(10, 50, 'div', '', 'Random Level')
      .setClassName('ui-tool-button')
      .addListener('click')
      .setOrigin(0, 0)
      .on('click', () => {
        this.game.setScene('Play');
      });

    await this.loadLevels();

    this.uiLevels = this.levels.map(({ id, name }, i) => {
      const uiLevel = this.add
        .dom(200, 40 + i * 100, 'div', '', name)
        .setClassName('ui-level-select')
        .setOrigin(0, 0);

      const inner = document.createElement('div');
      // inner.innerText = name;
      uiLevel.node.appendChild(inner);

      const editButton = document.createElement('button');
      inner.appendChild(editButton);
      editButton.classList.add('ui-tool-button');
      editButton.innerText = 'Edit';
      editButton.addEventListener('click', () => {
        this.game.setScene('Editor', { mapKey: id });
      });

      const playButton = document.createElement('button');
      inner.appendChild(playButton);
      playButton.classList.add('ui-tool-button');
      playButton.innerText = 'Play';
      playButton.addEventListener('click', () => {
        this.game.setScene('Play', {
          mapKey: id,
        });
      });

      return uiLevel;
    });
  }
}
