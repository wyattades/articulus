import Phaser from 'phaser';

import { PLAY_TOOL_TYPES } from '../tools';
import { Terrain } from '../lib/terrain';
import { Matter } from '../lib/physics';
import { MapSaver } from '../lib/saver';
import theme from '../styles/theme';
import ToolManager from '../tools/ToolManager';

const MAX_PARTS = 32;

export default class Play extends Phaser.Scene {
  running = false;

  /** @type import('./UI').default */
  ui;

  // used by multiple tools e.g. SelectTool
  selected;

  // used in lib/physics
  partJoints;

  // Whether scene is running or not
  running;

  // `Part` that the camera is following
  followingPart = null;

  constructor() {
    super({
      key: 'Play',
    });
  }

  init(data) {
    this.mapKey = data.mapKey;
    this.mapSaver = this.mapKey ? new MapSaver(this.mapKey) : null;

    this.ui = this.scene.get('UI');
    this.selected = [];
    this.partJoints = {};
  }

  setRunning(running) {
    this.running = running;
    if (running) {
      this.refreshCameraFollower(() => {
        this.matter.resume();

        // TODO: don't enable cursor on physics-enabled objects
        // this.events.emit('setRunning', running);
        // this.tm.tools.find((tool) =>
        //   tool.refreshCursor ? tool.refreshCursor() || true : false,
        // );
      });
    } else {
      this.matter.pause();
      this.followingPart = null;
      this.cameras.main.stopFollow();
    }

    this.ui.stateText.setText(running ? 'Running' : 'Paused');
  }

  refreshCameraFollower(cb) {
    const camera = this.cameras.main;

    camera.panEffect.reset();
    camera.stopFollow();
    this.followingPart = null;

    const follow = this.parts.getLast(true);
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
        dist * 0.6,
        Phaser.Math.Easing.Quadratic.InOut,
        false,
        (_, progress) => {
          if (progress === 1) {
            cb?.();

            this.followingPart = follow;
            camera.startFollow(follow, false, 0.08, 0.08);
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

    this.input.keyboard.on('keydown-R', this.restart);

    this.input.keyboard.on('keydown-P', () => {
      const debug = !localStorage.getItem('fc:debug');
      localStorage.setItem('fc:debug', debug ? '1' : '');

      // TODO: this only works for disabling dubugging
      this.matter.config.debug = debug;

      this.restart();
    });

    Matter.Events.on(this.matter.world.localWorld, 'afterAdd', ({ object }) => {
      if (object.type === 'body' && this.parts.getLength() > MAX_PARTS) {
        this.ui.flash('MAX ITEM LIMIT EXCEEDED');
        setTimeout(() => object.gameObject.destroy());
      }
    });
  }

  restart = () => {
    this.matter.world.destroy();
    this.scene.restart();
  };

  create() {
    // CAMERA

    this.cameras.main.setBackgroundColor(theme.blueSky);

    // CURSOR

    this.cursor = this.add
      .circle(0, 0, 6, 0xeeeeee)
      .setStrokeStyle(1, 0xbbbbbb)
      .setVisible(false)
      .setDepth(1000);

    // GROUPS

    this.parts = this.add.group();
    this.terrainGroup = this.add.group();

    // WORLD

    let worldW, worldH;
    if (this.mapSaver) {
      this.mapSaver
        .load()
        .then((mapData) => MapSaver.loadPlayParts(mapData, this.terrainGroup));
    } else {
      const terrain = new Terrain(this);
      this.terrainGroup.add(terrain);

      worldW = terrain.width;
      worldH = terrain.height;
    }

    // PHYSICS

    this.matter.world.setBounds(0, 0, worldW || 1000, worldH || 1000);

    // INPUTS

    this.cursors = this.input.keyboard.createCursorKeys();

    this.createListeners();

    this.tm = new ToolManager(this, PLAY_TOOL_TYPES[0], ['nav']);

    // START

    this.setRunning(false);
  }

  snapToGrid(obj) {
    return obj;
  }

  update(_, delta) {
    const CAMERA_SPEED = (0.4 * delta) / this.cameras.main.zoom;
    const { left, right, up, down } = this.cursors;
    if (left.isDown && !right.isDown) {
      this.cameras.main.scrollX -= CAMERA_SPEED;
    } else if (right.isDown && !left.isDown) {
      this.cameras.main.scrollX += CAMERA_SPEED;
    }
    if (up.isDown && !down.isDown) {
      this.cameras.main.scrollY -= CAMERA_SPEED;
    } else if (down.isDown && !up.isDown) {
      this.cameras.main.scrollY += CAMERA_SPEED;
    }
  }
}
