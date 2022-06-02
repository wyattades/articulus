import Phaser from 'phaser';
// eslint-disable-next-line import/no-named-as-default
import Router from 'next/router';

import PlayScene from 'src/scenes/Play';
import EditorScene from 'src/scenes/Editor';
import { settingsSaver } from 'lib/saver';

export default class Game extends Phaser.Game {
  constructor(canvas, parent) {
    super({
      parent,
      canvas,
      type: Phaser.WEBGL,
      width: parent.clientWidth,
      height: parent.clientHeight,
      scale: {
        mode: Phaser.Scale.ScaleModes.RESIZE,
      },
      physics: {
        default: 'matter',
        matter: {
          enableSleep: true,
          debug: !!settingsSaver.get('debug'),
        },
      },
    });

    // TODO: scene lazy-loading?
    for (const Scene of [EditorScene, PlayScene]) {
      this.scene.add(Scene.name, Scene);
    }

    console.log('Init Game');
  }

  async waitForSceneReady(sceneKey) {
    let scene = this.scene.getScene(sceneKey);
    if (scene) return scene;

    await new Promise((r) => this.events.once(Phaser.Core.Events.POST_STEP, r));

    scene = this.scene.getScene(sceneKey);

    return scene;
  }

  destroy() {
    for (const scene of this.scene.getScenes(true)) {
      scene.shutdown?.();
      this.scene.stop(scene.scene.key);
    }

    super.destroy();

    this.destroyed = true;
  }

  setScene(key, { mapKey } = {}) {
    const url =
      {
        Menu: '/',
        Editor: mapKey ? `/edit/${mapKey}` : '/edit',
        Play: mapKey ? `/play/${mapKey}` : '/play',
      }[key] || '/';

    Router.push(url);
  }
}
