import type { User as AuthUser } from 'next-auth';
import Router from 'next/router';
import Phaser from 'phaser';

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
  constructor(
    canvas: HTMLCanvasElement,
    parent: HTMLElement,
    readonly authUser: AuthUser | undefined,
  ) {
    // const { clientWidth: parentW, clientHeight: parentH } = parent;

    super({
      canvas,
      type: Phaser.WEBGL,
      scale: {
        parent,
        mode: Phaser.Scale.ScaleModes.RESIZE,
        autoRound: true,
        // setting any `zoom != 1` causes a pixelated effect, which I kinda like
        zoom: 2,
        // zoom: Phaser.Scale.Zoom.ZOOM_4X,
        // zoom: window.devicePixelRatio,
        expandParent: false,
      },
      // https://developer.chrome.com/blog/desynchronized#avoiding_flicker
      // idk if these are needed
      preserveDrawingBuffer: true,
      desynchronized: true,
      physics: {
        default: 'matter',
        matter: {
          // TODO: cross-platform consistent physics speed
          runner: {
            fps: 100,
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

  async startSceneAndReady(sceneKey: string, data?: Record<string, unknown>) {
    return new Promise<BaseScene>((resolve, reject) => {
      this.events.once(Phaser.Core.Events.POST_STEP, () => {
        const scene = this.scene.getScene(sceneKey) as BaseScene | undefined;
        if (scene && scene.scene.key === sceneKey) resolve(scene);
        else if (scene)
          reject(
            new Error(`Scene key mismatch: ${scene.scene.key} !== ${sceneKey}`),
          );
        else reject(new Error(`Scene not started: ${sceneKey}`));
      });

      this.scene.start(sceneKey, data);

      const scene = this.scene.getScene(sceneKey) as BaseScene;
      if (scene) resolve(scene);
    });
  }

  destroyed = false;
  id = (window.gameCounter = (window.gameCounter || 0) + 1);

  destroy() {
    this.destroyed = true;

    for (const scene of this.scene.getScenes<BaseScene[]>(true)) {
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
