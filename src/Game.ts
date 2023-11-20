import Phaser from 'phaser';
// eslint-disable-next-line import/no-named-as-default
import Router from 'next/router';

import { settingsSaver } from 'lib/saver';
import EditorScene from 'src/scenes/Editor';
import PlayScene from 'src/scenes/Play';
import type { BaseScene } from 'src/scenes/Scene';

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
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
          // TODO: cross-platform consistent physics speed
          runner: {
            fps: 60,
          },
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

  async waitForSceneReady(sceneKey: string): Promise<BaseScene> {
    let scene = this.scene.getScene(sceneKey) as BaseScene;
    if (scene) return scene;

    await new Promise((r) =>
      this.events.once(Phaser.Core.Events.POST_STEP as string, r),
    );

    scene = this.scene.getScene(sceneKey) as BaseScene;

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
      this.events.once(Phaser.Core.Events.DESTROY as string, resolve);
    });

    super.destroy(false);

    console.log('Destroyed game:', this.id);

    return promise;
  }

  setScene(key: string, { mapKey }: { mapKey?: string | null } = {}) {
    const url =
      {
        Menu: '/',
        Editor: mapKey ? `/edit/${mapKey}` : '/edit',
        Play: mapKey ? `/play/${mapKey}` : '/play',
      }[key] || '/';

    void Router.push(url);
  }
}
