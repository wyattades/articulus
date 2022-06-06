import Phaser from 'phaser';
// eslint-disable-next-line import/no-named-as-default
import Router from 'next/router';

import PlayScene from 'src/scenes/Play';
import EditorScene from 'src/scenes/Editor';
import { BaseScene } from 'src/scenes/Scene';
import { settingsSaver } from 'lib/saver';

declare global {
  interface Window {
    gameCounter?: number;
  }
}

export default class Game extends Phaser.Game {
  constructor(canvas: HTMLCanvasElement, parent: HTMLElement) {
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
          enableSleeping: true,
          debug: !!settingsSaver.get('debug'),
        },
      },
      title: 'Articulus',
      url: process.env.VERCEL_URL || '',
    });

    // TODO: scene lazy-loading?
    for (const Scene of [EditorScene, PlayScene]) {
      this.scene.add(Scene.name, Scene);
    }

    console.log('Init game:', this.id);
  }

  async waitForSceneReady(sceneKey) {
    let scene = this.scene.getScene(sceneKey);
    if (scene) return scene;

    await new Promise((r) => this.events.once(Phaser.Core.Events.POST_STEP, r));

    scene = this.scene.getScene(sceneKey);

    return scene;
  }

  destroyed = false;
  id = (window.gameCounter = (window.gameCounter || 0) + 1);

  destroy() {
    this.destroyed = true;

    for (const scene of this.scene.getScenes(true) as BaseScene[]) {
      scene.shutdown?.();
      this.scene.stop(scene.scene.key);
    }

    const promise = new Promise((resolve) => {
      this.events.once(Phaser.Core.Events.DESTROY, resolve);
    });

    super.destroy(false);

    console.log('Destroyed game:', this.id);

    return promise;
  }

  setScene(key: string, { mapKey }: { mapKey?: string } = {}) {
    const url =
      {
        Menu: '/',
        Editor: mapKey ? `/edit/${mapKey}` : '/edit',
        Play: mapKey ? `/play/${mapKey}` : '/play',
      }[key] || '/';

    Router.push(url);
  }
}
