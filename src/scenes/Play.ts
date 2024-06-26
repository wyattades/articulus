import * as _ from 'lodash-es';
import Phaser from 'phaser';

import { Matter, clonePhysics } from 'lib/physics';
import { BuildSaver, MapSaver, settingsSaver } from 'lib/saver';
import { Terrain } from 'lib/terrain';
import { validPoint } from 'lib/utils';
import { fitCameraToObjs, getObjectsBounds } from 'lib/utils/phaser';
import { TEMP_RECT, TEMP_RECT2 } from 'lib/utils/temp';
import { CONNECTOR_RADIUS, MAX_PARTS } from 'src/const';
import type { Part } from 'src/objects';
import { GoalObject, GoalZone } from 'src/objects';
import { COLORS } from 'src/styles/theme';
import { PLAY_TOOL_TYPES } from 'src/tools';
import ToolManager from 'src/tools/ToolManager';

import { BaseScene, type ObjectsGroup } from './Scene';

export default class Play extends BaseScene {
  mapSaver!: MapSaver | null;
  mapKey?: string;
  terrainGroup!: ObjectsGroup<Part | Terrain>;
  buildSaver!: BuildSaver;
  selected!: Part[];

  constructor() {
    super({
      key: 'Play',
    });
  }

  init(data: { mapKey?: string }) {
    this.mapKey = data.mapKey;
    this.mapSaver = this.mapKey ? new MapSaver({ slug: this.mapKey }) : null;
    this.buildSaver = new BuildSaver();

    this.selected = [];
  }

  // Whether scene is running or not
  get running() {
    return !!this.matter.world?.enabled;
  }

  setRunning(running: boolean) {
    if (this.cameras.main.panEffect.isRunning) return;

    if (running) {
      void this.saveBuild('flush');

      this.refreshCameraFollower(() => {
        this.matter.resume();

        // TODO: don't enable cursor on physics-enabled objects
        // this.events.emit('setRunning', running);
        // this.tm.tools.find((tool) =>
        //   tool.refreshCursor ? tool.refreshCursor() || true : false,
        // );

        for (const part of this.parts.getChildren()) part.resume();
      });
    } else {
      this.matter.pause();
      this.cameras.main.stopFollow();

      for (const part of this.parts.getChildren()) part.pause();
    }

    this.events.emit('setRunning', running);

    this.events.emit('setSelected', []);
  }

  refreshCameraFollower(cb?: () => void) {
    const camera = this.cameras.main;
    if (!camera) return;

    camera.panEffect.reset();
    camera.stopFollow();

    const follow = _.findLast(this.parts.getChildren(), validPoint) as
      | Part
      | undefined;

    if (follow) {
      const dist = Phaser.Math.Distance.Between(
        camera.scrollX,
        camera.scrollY,
        follow.x,
        follow.y,
      );

      camera.pan(
        follow.x,
        follow.y,
        Math.min(2000, dist * 0.6),
        Phaser.Math.Easing.Quadratic.InOut,
        false,
        (_camera, progress) => {
          if (progress === 1) {
            cb?.();

            if (this.running && validPoint(follow)) {
              // camera.setZoom(Math.round(camera.zoom));
              camera.startFollow(follow, true, 0.08, 0.08);

              // super stupid failure case just in case somethin is NaN once physics kicks in
              const prevX = camera.scrollX,
                prevY = camera.scrollY;
              setTimeout(() => {
                if (!validPoint(follow) || !follow.scene) {
                  console.warn('Invalid follow after resume!');
                  camera.stopFollow();
                  camera.setScroll(prevX, prevY);
                }
              });
            }
          }
        },
      );
    } else {
      cb?.();
    }
  }

  preload() {
    // this.load.image('cookie', 'assets/cookie.png');

    if (this.load.inflight.size > 0) {
      const loadingMsg = (value = 0) => `Loading Assets: ${value * 100}%`;
      const loadingText = this.add.text(100, 300, loadingMsg(), {
        fontSize: '40px',
      });
      this.load.on('progress', (value: number) => {
        loadingText.setText(loadingMsg(value));
      });
      this.load.on('complete', () => {
        loadingText.destroy();
      });
    }
  }

  createListeners() {
    this.modifierKey = this.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SHIFT,
    );

    this.keyboard.on('keydown-SPACE', (evt: KeyboardEvent) => {
      evt.preventDefault();

      if (document.activeElement !== this.game.canvas) {
        (document.activeElement as HTMLElement)?.blur?.();
        this.game.canvas.focus(); // NOOP
      }

      this.setRunning(!this.running);
    });

    this.input.on('pointerup', () => {
      void this.saveBuild('queue');
    });

    this.keyboard.on('keydown-R', () => this.restart());

    this.keyboard.on('keydown-K', () => {
      this.parts.clear(true, true);
      void this.saveBuild();
    });

    this.keyboard.on('keydown-T', () => {
      this.game.setScene('Editor', {
        mapKey: this.mapKey,
      });
    });

    this.keyboard.on('keydown-P', () => {
      const debug = !settingsSaver.get('debug');
      settingsSaver.set('debug', debug);

      this.matter.config.debug = debug;

      this.restart();
    });

    Matter.Events.on(this.matter.world.engine, 'collisionActive', (event) => {
      const evt = event as Matter.IEvent<MatterJS.Engine> & {
        pairs: Matter.Pair[];
      };
      for (const pair of evt.pairs) {
        const a = (pair.bodyA as FC.Body).gameObject;
        const b = (pair.bodyB as FC.Body).gameObject;
        if (!a || !b) continue;
        if (
          (a instanceof GoalObject && b instanceof GoalZone) ||
          (b instanceof GoalObject && a instanceof GoalZone)
        ) {
          const [go, gz] = a instanceof GoalObject ? [a, b] : [b, a];
          if (
            Phaser.Geom.Rectangle.ContainsRect(
              gz.getBounds(TEMP_RECT),
              go.getBounds(TEMP_RECT2),
            )
          ) {
            // TODO: better win state
            this.showFlash('YOU WIN!', 'win');
            this.setRunning(false);
          }
        }
      }
    });
  }

  precheckMaxItems(additionalCount: number) {
    if (this.parts.getLength() + additionalCount > MAX_PARTS) {
      this.showFlash('MAX ITEM LIMIT EXCEEDED');
      return true;
    }
    return false;
  }

  duplicateSelected() {
    if (this.precheckMaxItems(this.selected.length)) return;

    const bounds = getObjectsBounds(this.selected);
    if (!bounds) return;

    const newObjs = this.selected.map((obj) => {
      const newObj = obj.clone();
      // TODO: let user click where they want to "paste" the duplicates
      newObj.setPosition(obj.x + bounds.width + 40, obj.y);
      this.parts.add(newObj);

      return newObj;
    });

    clonePhysics(this, this.selected, newObjs);

    for (const obj of newObjs) obj.saveRender();

    this.events.emit('setSelected', newObjs);

    this.refreshCameraFollower();
  }

  restart() {
    this.matter.world.destroy();
    this.scene.restart();
  }

  cachedBuildIds() {
    try {
      const raw = localStorage.getItem('articulus:map_latest_builds');
      const obj =
        raw && (JSON.parse(raw) as Record<string, string | undefined> | null);
      if (obj && typeof obj === 'object') return obj;
    } catch {}
    return {};
  }
  setCachedBuildId() {
    if (!this.buildSaver?.id) return;

    const mapId = this.mapSaver?.id || '__default';

    localStorage.setItem(
      'articulus:map_latest_builds',
      JSON.stringify({
        ...this.cachedBuildIds(),
        [mapId]: this.buildSaver.id,
      }),
    );
  }

  async loadObjects() {
    if (this.mapSaver) {
      const mapData = await this.mapSaver.load();
      if (!this.scene.isActive()) return;

      MapSaver.loadPlayParts(mapData, this.terrainGroup);

      fitCameraToObjs(this.cameras.main, this.terrainGroup.getChildren());
    }

    const mapId = this.mapSaver?.id || '__default';

    const buildId = this.cachedBuildIds()[mapId];
    if (buildId) {
      this.buildSaver.id = buildId;

      const buildData = await this.buildSaver.load();
      if (!this.scene.isActive()) return;

      if (buildData) BuildSaver.loadPlayParts(buildData, this.parts);
    }
  }

  async saveBuild(type?: 'queue' | 'flush') {
    if (type === 'queue') await this.buildSaver.queueSave(this.parts);
    else if (type === 'flush') await this.buildSaver.queueSave.flush();
    else await this.buildSaver.save(this.parts);

    this.setCachedBuildId();
  }

  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  create() {
    // CAMERA

    const camera = this.cameras.main;
    camera.setBackgroundColor(COLORS.blueSky);
    camera.setScroll(-camera.width / 2, -camera.height / 2);

    // CURSOR

    this.cursor = this.add
      .circle(0, 0, CONNECTOR_RADIUS, 0xeeeeee)
      .setStrokeStyle(1, 0xbbbbbb)
      .setVisible(false)
      .setDepth(1000);

    // GROUPS

    this.parts = this.add.group() as unknown as typeof this.parts;
    this.terrainGroup = this.add.group() as unknown as typeof this.terrainGroup;

    // WORLD

    if (this.mapSaver) {
      this.worldBounds = new Phaser.Geom.Rectangle(-1000, -1000, 3000, 3000);
    } else {
      const terrain = new Terrain(this);
      this.terrainGroup.add(terrain);

      // we want world-pos 0,0 to be 300px above the y-pos of the center of the terrain
      terrain.setPosition(-terrain.width / 2, -terrain.midY + 300);
      terrain.updateGeomCache();

      this.worldBounds = new Phaser.Geom.Rectangle(
        -terrain.width / 2,
        -terrain.height,
        terrain.width,
        terrain.y + 2 * terrain.height,
      );
    }

    // outline of world boundary
    this.add
      .rectangle(
        this.worldBounds.centerX,
        this.worldBounds.centerY,
        this.worldBounds.width,
        this.worldBounds.height,
      )
      .setStrokeStyle(2, 0xffffff, 0.9)
      .setDepth(-1);

    // PHYSICS

    this.matter.world.setBounds(
      this.worldBounds.x,
      this.worldBounds.y,
      this.worldBounds.width,
      this.worldBounds.height,
      128,
    );

    // INPUTS

    this.cursors = this.keyboard.createCursorKeys();

    this.createListeners();

    this.tm = new ToolManager(this, PLAY_TOOL_TYPES[0], ['nav']);

    // LOAD OBJECTS
    this.loadObjects().catch((err) => {
      console.error(err);
      this.showFlash('Failed to load game objects!');
    });

    // START

    this.setRunning(false);
  }

  update(_t: number, delta: number) {
    this.stats?.update();

    const camera = this.cameras.main;
    const CAMERA_SPEED = (0.4 * delta) / camera.zoom;
    const { left, right, up, down } = this.cursors;
    if (left.isDown && !right.isDown) {
      camera.scrollX -= CAMERA_SPEED;
    } else if (right.isDown && !left.isDown) {
      camera.scrollX += CAMERA_SPEED;
    }
    if (up.isDown && !down.isDown) {
      camera.scrollY -= CAMERA_SPEED;
    } else if (down.isDown && !up.isDown) {
      camera.scrollY += CAMERA_SPEED;
    }
  }

  shutdown() {
    this.tm?.destroy();
    // @ts-expect-error shutdown type
    this.tm = null;
  }
}
