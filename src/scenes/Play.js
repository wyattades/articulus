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

  selected = [];

  constructor() {
    super({
      key: 'Play',
    });
  }

  init(data) {
    this.mapKey = data.mapKey;
    if (this.mapKey) this.mapSaver = new MapSaver(this.mapKey);

    this.ui = this.scene.get('UI');
  }

  setRunning(running) {
    this.running = running;
    if (running) {
      const follow = this.parts.getLast(true);
      if (follow) {
        const dist = Phaser.Math.Distance.Between(
          this.cameras.main.scrollX,
          this.cameras.main.scrollY,
          follow.x,
          follow.y,
        );
        this.cameras.main.pan(
          follow.x,
          follow.y,
          dist * 0.6,
          Phaser.Math.Easing.Quadratic.InOut,
          false,
          (_, progress) => {
            if (progress === 1) {
              this.matter.resume();
              this.cameras.main.startFollow(follow, false, 0.08, 0.08);
            }
          },
        );
      }
    } else {
      this.matter.pause();
      this.cameras.main.stopFollow();
    }

    // TODO: ???
    // if (this.tool && this.tool.refreshCursor) this.tool.refreshCursor();
    this.ui.stateText.setText(running ? 'Running' : 'Paused');
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
    this.input.keyboard.addKey('SPACE').on('down', () => {
      this.setRunning(!this.running);
    });

    this.input.keyboard.addKey('R').on('down', this.restart);

    this.input.keyboard.addKey('P').on('down', () => {
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
    // key event listeners aren't cleared automatically :(
    for (const ee of this.input.keyboard.keys) if (ee) ee.removeAllListeners();
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

    if (this.mapSaver) {
      this.mapSaver
        .load()
        .then((mapData) => MapSaver.loadPlayParts(mapData, this.terrainGroup));
    } else {
      const terrain = new Terrain(this);
      this.terrainGroup.add(terrain);

      this.matter.world.setBounds(0, 0, terrain.width, terrain.height);
    }

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
