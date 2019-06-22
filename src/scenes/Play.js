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
    // this.tool = tool;
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

  refreshCursor(x, y) {
    let jointPoint = null;
    for (const child of this.parts.getChildren()) {
      if (this.drawLine && child === this.drawLine.line) continue;
      jointPoint = child.getHoverPoint(x, y, 10);
      if (jointPoint) {
        if (!this.cursor.visible) this.cursor.setVisible(true);
        this.cursor.setPosition(jointPoint.x, jointPoint.y);
        this.cursor.setData('connectObj', child);
        break;
      }
    }
    if (!jointPoint && this.cursor.visible) this.cursor.setVisible(false);
  }

  createListeners() {
    this.input.on('pointerdown', ({ x, y }) => {
      if (this.tool) {
        if (this.cursor.visible) {
          x = this.cursor.x;
          y = this.cursor.y;
        }
        this.tool.handlePointerDown(x, y);
      }
    });

    this.input.on('pointermove', ({ x, y }) => {
      this.refreshCursor(x, y);

      if (this.tool) {
        if (this.cursor.visible) {
          x = this.cursor.x;
          y = this.cursor.y;
        }
        this.tool.handleMove(x, y);
      }
    });

    this.input.on('pointerup', ({ x, y }) => {
      if (this.tool) {
        this.tool.handlePointerUp(x, y);
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
    this.matter.world.setBounds(
      0,
      0,
      this.game.config.width,
      this.game.config.height,
    );

    this.parts = this.add.group(null, {
      max: 30,
    });

    this.uiGroup = this.add.group();
    this.cursor = this.add
      .circle(0, 0, 10, 0xff0000, 0.8)
      .setVisible(false)
      .setDepth(Infinity);
    this.uiGroup.add(this.cursor);

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

    this.setRunning(false);
    this.setTool(TOOL_TYPES[0]);

    this.createListeners();
  }
}
