import Phaser from 'phaser';

import PlayScene from './scenes/Play';
import UIScene from './scenes/UI';

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
      scene: [UIScene, PlayScene],
    });
  }
}
