import Phaser from 'phaser';

import { TOOL_TYPES, TOOLS } from '../tools';
import { constrain } from '../lib/utils';
import * as terrain from '../lib/terrain';

export default class Play extends Phaser.Scene {
  running = false;

  constructor() {
    super({
      key: 'Play',
      active: true,
    });
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

    this.scene.get('UI').stateText.setText(running ? 'Running' : 'Paused');
  }

  setTool(toolType) {
    if (this.tool) this.tool.destroy();

    const { ToolClass } = TOOLS[toolType];

    // Same tool
    if (this.tool && this.tool.prototype === ToolClass) return;

    this.tool = new ToolClass(this, toolType);

    for (const button of this.scene.get('UI').toolButtons)
      button.node.classList.toggle(
        'is-active',
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
    this.input.on('pointerdown', ({ worldX, worldY }) => {
      if (this.tool) {
        this.tool.handlePointerDown(worldX, worldY);
      }
    });

    this.input.on('pointermove', ({ worldX, worldY }) => {
      if (this.tool) {
        this.tool.handleMove(worldX, worldY);
      }
    });

    this.input.on('pointerup', ({ worldX, worldY }) => {
      if (this.tool) {
        this.tool.handlePointerUp(worldX, worldY);
      }
    });

    this.input.keyboard.addKey('SPACE').on('down', () => {
      this.setRunning(!this.running);
    });

    this.input.keyboard.addKey('R').on('down', () => {
      // key event listeners aren't cleared automatically :(
      for (const ee of this.input.keyboard.keys)
        if (ee) ee.removeAllListeners();
      this.matter.world.destroy();
      this.scene.restart();
    });

    this.game.canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.cameras.main.setZoom(
          constrain(this.cameras.main.zoom + e.deltaY * 0.01, 0.2, 10),
        );
      },
      false,
    );
    // this.input.on('wheel', (x) => {
    //   console.log(x);
    // });
  }

  create() {
    // PHYSICS

    // this.matter.world.setBounds(
    //   0,
    //   0,
    //   this.game.config.width,
    //   this.game.config.height,
    // );

    // GROUPS

    this.parts = this.add.group(null, {
      max: 30,
    });

    // this.joints = this.add.group(null);

    // CAMERA

    this.cameras.main.setBackgroundColor(0x82ceed);

    this.cursors = this.input.keyboard.createCursorKeys();

    // CURSOR

    this.cursor = this.add
      .circle(0, 0, 10, 0xff0000, 0.8)
      .setVisible(false)
      .setDepth(1000);

    // SETUP

    this.setRunning(false);
    this.setTool(TOOL_TYPES[0]);

    this.createListeners();

    terrain.init(this);
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
