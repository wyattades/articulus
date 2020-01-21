import Phaser from 'phaser';

import PlayScene from './scenes/Play';
import UIScene from './scenes/UI';
import EditorScene from './scenes/Editor';
import EditorUIScene from './scenes/EditorUI';
import MenuScene from './scenes/Menu';
import * as routes from './routes';

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
          debug: !!localStorage.getItem('fc:debug'),
        },
      },
      dom: {
        createContainer: true,
      },
    });

    // TODO: scene lazy-loading?
    for (const Scene of [
      MenuScene,
      EditorUIScene,
      EditorScene,
      UIScene,
      PlayScene,
    ])
      this.scene.add(Scene.name, Scene);

    this.unlisten = routes.listen((key, data) => {
      if (key) this._setScene(key, data);
      else routes.replace('Menu');
    });

    const [key, data] = routes.getKeyParams();
    if (key) this._setScene(key, data);
    else routes.replace('Menu'); // TODO: show a 404 page?
  }

  destroy() {
    this.unlisten();
    super.destroy();
  }

  _setScene(key, data = {}) {
    // the order that we stop scenes matters
    // i.e. must stop 'UI' scene before 'Play' (I think)
    for (const scene of this.scene.getScenes(true)) {
      this.scene.stop(scene.scene.key);
    }

    if (key === 'Play') {
      this.scene.start('UI', data);
      this.scene.start('Play', data);
    } else if (key === 'Editor') {
      this.scene.start('EditorUI', data);
      this.scene.start('Editor', data);
    } else {
      this.scene.start(key, data);
    }
  }

  setScene(key, data) {
    routes.push(key, data);
  }
}
