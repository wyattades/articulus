import Phaser from 'phaser';
import * as _ from 'lodash-es';

import { PLAY_TOOL_TYPES } from 'src/tools';
import { Terrain } from 'lib/terrain';
import { BuildSaver, MapSaver, settingsSaver } from 'lib/saver';
import { COLORS } from 'src/styles/theme';
import ToolManager from 'src/tools/ToolManager';
import { MAX_PARTS, CONNECTOR_RADIUS } from 'src/const';
import { fitCameraToObjs, getObjectsBounds, validPoint } from 'lib/utils';
import { clonePhysics } from 'src/lib/physics';

import { BaseScene } from './Scene';

export default class Play extends BaseScene {
  // used by multiple tools e.g. SelectTool
  /** @type {Phaser.GameObjects.GameObject[]} */
  selected;

  /** @type {Phaser.GameObjects.Shape} */
  cursor;

  constructor() {
    super({
      key: 'Play',
    });
  }

  init(data) {
    this.mapKey = data.mapKey;
    this.mapSaver = this.mapKey ? new MapSaver(this.mapKey) : null;
    this.buildSaver = new BuildSaver();

    this.selected = [];
  }

  // Whether scene is running or not
  get running() {
    return !!this.matter.world?.enabled;
  }

  setRunning(running) {
    if (this.cameras.main.panEffect.isRunning) return;

    if (running) {
      this.saveBuild('flush');

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

  refreshCameraFollower(cb) {
    const camera = this.cameras.main;
    if (!camera) return;

    camera.panEffect.reset();
    camera.stopFollow();

    const follow = _.findLast(this.parts.getChildren(), validPoint);

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
              camera.startFollow(follow, false, 0.08, 0.08);

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
      const loadingMsg = (value = 0) =>
        `Loading Assets: ${Number.parseInt(value * 100, 10)}%`;
      const loadingText = this.add.text(100, 300, loadingMsg(), {
        fontSize: '40px',
      });
      this.load.on('progress', (value) => {
        loadingText.setText(loadingMsg(value));
      });
      this.load.on('complete', () => {
        loadingText.destroy();
      });
    }
  }

  createListeners() {
    this.input.keyboard.on('keydown-SPACE', () => {
      this.setRunning(!this.running);
    });

    this.input.on('pointerup', () => {
      this.saveBuild('queue');
    });

    this.input.keyboard.on('keydown-R', () => this.restart());

    this.input.keyboard.on('keydown-K', () => {
      this.parts.clear(true, true);
      this.saveBuild();
    });

    this.input.keyboard.on('keydown-T', () => {
      this.game.setScene('Editor', {
        mapKey: this.mapKey,
      });
    });

    this.input.keyboard.on('keydown-P', () => {
      const debug = !settingsSaver.get('debug');
      settingsSaver.set('debug', debug);

      this.matter.config.debug = debug;

      this.restart();
    });
  }

  precheckMaxItems(additionalCount) {
    if (this.parts.getLength() + additionalCount > MAX_PARTS) {
      this.events.emit('showFlash', 'MAX ITEM LIMIT EXCEEDED');
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

    clonePhysics(this.play, this.selected, newObjs);

    for (const obj of newObjs) obj.saveRender();

    this.events.emit('setSelected', newObjs);

    this.refreshCameraFollower();
  }

  deleteSelected() {
    for (const obj of this.selected) obj.destroy();
    this.events.emit('setSelected', []);
  }

  restart() {
    this.matter.world.destroy();
    this.scene.restart();
  }

  cachedBuildIds() {
    try {
      const raw = localStorage.getItem('articulus:map_latest_builds');
      const obj = raw && JSON.parse(raw);
      if (obj && typeof obj === 'object') return obj;
    } catch {}
    return {};
  }
  setCachedBuildId() {
    if (!this.buildSaver?.id) return;

    const mapKey = this.mapSaver?.id || '__default';

    localStorage.setItem(
      'articulus:map_latest_builds',
      JSON.stringify({
        ...this.cachedBuildIds(),
        [mapKey]: this.buildSaver.id,
      }),
    );
  }

  async loadObjects() {
    if (this.mapSaver) {
      const mapData = await this.mapSaver.load();

      MapSaver.loadPlayParts(mapData, this.terrainGroup);

      fitCameraToObjs(this.cameras.main, this.terrainGroup.getChildren());
    }

    const mapKey = this.mapSaver?.id || '__default';

    const buildId = this.cachedBuildIds()[mapKey];
    if (buildId) {
      this.buildSaver.id = buildId;

      const buildData = await this.buildSaver.load();

      if (buildData) BuildSaver.loadPlayParts(buildData, this.parts);
    }
  }

  async saveBuild(type) {
    if (type === 'queue') await this.buildSaver.queueSave(this.parts);
    else if (type === 'flush') await this.buildSaver.queueSave.flush();
    else await this.buildSaver.save(this.parts);

    this.setCachedBuildId();
  }

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

    this.parts = this.add.group();
    this.terrainGroup = this.add.group();

    // WORLD

    if (this.mapSaver) {
      this.worldBounds = new Phaser.Geom.Rectangle(-1000, -1000, 3000, 3000);
    } else {
      const terrain = new Terrain(this);
      this.terrainGroup.add(terrain);

      // we want world-pos 0,0 to be 300px above the y-pos of the center of the terrain
      terrain.setPosition(-terrain.width / 2, -terrain.midY + 300);

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

    this.cursors = this.input.keyboard.createCursorKeys();

    this.createListeners();

    this.tm = new ToolManager(this, PLAY_TOOL_TYPES[0], ['nav']);

    // LOAD OBJECTS
    this.loadObjects().catch((err) => {
      console.error(err);
      this.events.emit('showFlash', 'Failed to load game objects!');
    });

    // START

    this.setRunning(false);
  }

  snapToGrid(_obj) {
    return false;
  }

  update(_t, delta) {
    // stats?.update(); TODO

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
    this.tm = null;
  }
}
