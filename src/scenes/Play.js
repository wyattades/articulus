import Phaser from 'phaser';

import { TOOL_TYPES, TOOLS } from '../tools';

export default class Play extends Phaser.Scene {
  running = false;

  setRunning(running) {
    this.running = running;
    if (running) this.matter.resume();
    else this.matter.pause();

    this.stateText.setText(running ? 'Running' : 'Paused');
  }

  setTool(toolType) {
    if (this.tool) this.tool.destroy();

    const { ToolClass, PartClass } = TOOLS[toolType];
    this.tool = new ToolClass(this, PartClass);

    for (const button of this.toolButtons)
      button.node.style.backgroundColor =
        button.getData('tool') === toolType ? 'green' : 'white';
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
      this.scene.restart();
    });
  }

  create() {
    // PHYSICS

    this.matter.world.setBounds(
      0,
      0,
      this.game.config.width,
      this.game.config.height,
    );

    // GROUPS

    this.parts = this.add.group(null, {
      max: 30,
    });

    // CAMERA

    this.cursors = this.input.keyboard.createCursorKeys();
    // this.input.

    // this.cameras.main.startFollow(ship, true, 0.09, 0.09);
    // this.cameras.main.roundPixels = true;

    // this.cameras.main.setZoom(4);

    // CURSOR

    this.uiGroup = this.add.container().setScrollFactor(0, 0, true);
    this.cursor = this.add
      .circle(0, 0, 10, 0xff0000, 0.8)
      .setVisible(false)
      .setDepth(Infinity);
    // this.uiGroup.add(this.cursor);

    // UI

    this.stateText = this.add
      .text(this.game.scale.width - 10, 10, '', {})
      .setOrigin(1, 0);
    this.uiGroup.add(this.stateText);
    this.toolButtons = TOOL_TYPES.map((toolType, i) => {
      const { label } = TOOLS[toolType];
      const button = this.add
        .dom(10, 10 + i * 30, 'button', null, label)
        .setOrigin(0, 0)
        .setData('tool', toolType)
        .addListener('click');
      button.on('click', () => this.setTool(toolType));
      this.uiGroup.add(button);
      return button;
    });

    // SETUP

    this.setRunning(false);
    this.setTool(TOOL_TYPES[0]);

    this.createListeners();
  }

  update(_, delta) {
    const CAMERA_SPEED = 0.4 * delta;
    const { left, right, up, down } = this.cursors;
    if (left.isDown && !right.isDown) {
      this.cameras.main.scrollX += CAMERA_SPEED;
    } else if (right.isDown && !left.isDown) {
      this.cameras.main.scrollX -= CAMERA_SPEED;
    }
    if (up.isDown && !down.isDown) {
      this.cameras.main.scrollY -= CAMERA_SPEED;
    } else if (down.isDown && !up.isDown) {
      this.cameras.main.scrollY += CAMERA_SPEED;
    }
  }
}
