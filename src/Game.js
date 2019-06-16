import Phaser from 'phaser';

import PlayScene from './scenes/Play';

export default class Game extends Phaser.Game {
  constructor(canvas) {
    super({
      canvas,
      type: Phaser.WEBGL,
      width: 1000,
      height: 800,
      physics: {
        default: 'matter',
        matter: {
          enableSleep: true,
          debug: true,
        },
      },
      scene: PlayScene,
    });
  }
}
