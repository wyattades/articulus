import Phaser from 'phaser';

import PlayScene from './scenes/Play';
import UIScene from './scenes/UI';
import EditorScene from './scenes/Editor';
import EditorUIScene from './scenes/EditorUI';

export default class Game extends Phaser.Game {
  constructor(canvas, parent) {
    super({
      parent,
      canvas,
      type: Phaser.WEBGL,
      width: 1000,
      height: 800,
      physics: {
        default: 'matter',
        matter: {
          enableSleep: true,
          // debug: true,
        },
      },
      dom: {
        createContainer: true,
      },
      scene: [EditorUIScene, EditorScene, UIScene, PlayScene],
    });

    this.scene.start('UI');
    this.scene.start('Play');

    window.addEventListener('keypress', (e) => {
      if (e.key === 't') this.toggleEditor();
    });
  }

  toggleEditor() {
    if (this.scene.isActive('Play')) {
      this.scene.stop('UI');
      this.scene.stop('Play');
      this.scene.start('EditorUI');
      this.scene.start('Editor');
    } else {
      this.scene.stop('EditorUI');
      this.scene.stop('Editor');
      this.scene.start('UI');
      this.scene.start('Play');
    }
  }
}
