import Phaser from 'phaser';

import { TOOL_TYPES, TOOLS } from '../tools';
import { constrain, EventManager } from '../lib/utils';
import { Terrain } from '../lib/terrain';
import { Matter } from '../lib/physics';
import { MapSaver } from '../lib/saver';
import theme from '../styles/theme';

const MAX_PARTS = 32;

export default class Play extends Phaser.Scene {
  running = false;

  /** @type import('./UI').default */
  ui;

  constructor() {
    super({
      key: 'Play',
    });
  }

  init(data) {
    this.mapKey = data.mapKey;
    this.mapData = new MapSaver(this.mapKey).load();

    this.ui = this.scene.get('UI');
  }

  setRunning(running) {
    console.log(this.cameras.main);
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

    if (this.tool && this.tool.refreshCursor) this.tool.refreshCursor();
    this.ui.stateText.setText(running ? 'Running' : 'Paused');
  }

  setTool(toolType) {
    if (this.tool) this.tool.destroy();

    const { ToolClass } = TOOLS[toolType];

    // Same tool
    if (this.tool && this.tool.prototype === ToolClass) return;

    this.tool = new ToolClass(this, toolType);

    for (const button of this.ui.toolButtons)
      button.node.classList.toggle(
        'ui-tool-button--active',
        button.getData('tool') === toolType,
      );
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
    this.input.on('pointerdown', ({ worldX, worldY, button, position }) => {
      // event.stopPropagation();
      // event.preventDefault();

      if (button === 2) {
        this.dragView = {
          x: this.cameras.main.scrollX + position.x,
          y: this.cameras.main.scrollY + position.y,
        };
        this.dragView.dx = worldX - this.cameras.main.scrollX;
        this.dragView.dy = worldY - this.cameras.main.scrollY;
      } else if (this.tool) {
        this.tool.handlePointerDown(worldX, worldY);
      }
    });

    this.input.on('pointermove', ({ worldX, worldY, position }) => {
      if (this.dragView) {
        this.cameras.main.setScroll(
          this.dragView.x - position.x,
          this.dragView.y - position.y,
        );
      } else if (this.tool) {
        this.tool.handlePointerMove(worldX, worldY);
      }
    });

    this.input.on('pointerup', ({ worldX, worldY, button }) => {
      if (button === 2) {
        this.dragView = null;
      } else if (this.tool) {
        this.tool.handlePointerUp(worldX, worldY);
      }
    });

    this.input.keyboard.addKey('SPACE').on('down', () => {
      this.setRunning(!this.running);
    });

    this.input.keyboard.addKey('R').on('down', this.restart);

    this.input.keyboard.addKey('P').on('down', () => {
      const debug = !localStorage.getItem('fc:debug');
      localStorage.setItem('fc:debug', debug ? '1' : '');

      this.matter.config.debug = debug;

      this.restart();
    });

    this.eventManager = new EventManager()
      .on(this.game.canvas, 'contextmenu', (e) => e.preventDefault())
      .on(this.game.canvas, 'wheel', (e) => {
        e.preventDefault();
        this.cameras.main.setZoom(
          // TODO: normalize zoom speed
          constrain(this.cameras.main.zoom + e.deltaY * 0.01, 0.2, 10),
        );
      });

    Matter.Events.on(this.matter.world.localWorld, 'afterAdd', ({ object }) => {
      if (object.type === 'body' && this.parts.getLength() > MAX_PARTS) {
        this.ui.flash('MAX ITEM LIMIT EXCEEDED');
        setTimeout(() => object.gameObject.destroy());
      }
    });

    this.events.on('shutdown', () => {
      this.eventManager.off();
    });
  }

  restart = () => {
    // key event listeners aren't cleared automatically :(
    for (const ee of this.input.keyboard.keys) if (ee) ee.removeAllListeners();
    this.matter.world.destroy();
    this.scene.restart();
  };

  create() {
    // GROUPS

    this.parts = this.add.group();
    this.terrainGroup = this.add.group();

    // CAMERA

    this.cameras.main.setBackgroundColor(theme.blueSky);

    this.cursors = this.input.keyboard.createCursorKeys();

    // CURSOR

    this.cursor = this.add
      .circle(0, 0, 6, 0xeeeeee)
      .setStrokeStyle(1, 0xbbbbbb)
      .setVisible(false)
      .setDepth(1000);

    // SETUP

    this.setRunning(false);
    this.setTool(TOOL_TYPES[0]);

    this.createListeners();

    if (this.mapData) {
      MapSaver.loadPlayParts(this.mapData, this.terrainGroup);
    } else {
      const terrain = new Terrain(this);
      this.terrainGroup.add(terrain);

      this.matter.world.setBounds(0, 0, terrain.width, terrain.height);
    }
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
