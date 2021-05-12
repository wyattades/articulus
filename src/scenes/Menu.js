import Phaser from 'phaser';

import { MapSaver } from 'lib/saver';

export default class Menu extends Phaser.Scene {
  constructor() {
    super({
      key: 'Menu',
    });
  }

  levels = [];

  async loadLevels() {
    try {
      this.levels = [...(await MapSaver.loadMapsMeta())];
    } catch (err) {
      console.error('loadLevels', err);
    }

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

    const rows = 7;
    this.uiLevels = this.levels.map(({ id, name }, i) => {
      const uiLevel = this.add
        .dom(
          200 + Math.floor(i / rows) * 200,
          40 + (i % rows) * 100,
          'div',
          '',
          name,
        )
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

    if (this.levels.length === 0) {
      this.add
        .dom(
          this.scale.width / 2,
          this.scale.height / 2,
          'div',
          '',
          'No levels!',
        )
        .setClassName('ui-text');
    }
  }
}
