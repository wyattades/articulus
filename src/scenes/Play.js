import Phaser from 'phaser';

import { stiffConnect } from '../lib/physics';
import { Line, Wheel, PART_TYPES, PART_CLASSES } from '../objects';

export default class Play extends Phaser.Scene {
  running = false;

  setRunning(running) {
    this.running = running;
    if (running) this.matter.resume();
    else this.matter.pause();

    this.stateText.setText(running ? 'Running' : 'Paused');
  }

  setTool(tool) {
    this.tool = tool;
    for (const button of this.toolButtons)
      button.node.style.backgroundColor =
        button.getData('tool') === tool ? 'green' : 'white';
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

  activateDrawLine() {
    let line = null;
    if (this.drawLine) {
      // if (this.tool) {
      line = this.drawLine.line.enablePhysics();
      // } else this.drawLine.line.destroy();
      this.drawLine = null;
    }
    return line;
  }

  createListeners() {
    this.input.on('pointerdown', ({ x, y }) => {
      if (this.cursor.visible) {
        x = this.cursor.x;
        y = this.cursor.y;
      }
      const lineExisted = this.activateDrawLine();

      const ToolClass = PART_CLASSES[this.tool];
      if (ToolClass.prototype instanceof Line) {
        if (!lineExisted) {
          const line = new ToolClass(this, x, y, x, y);
          this.drawLine = { x, y, line };
          this.parts.add(line);
          if (this.cursor.visible) {
            line.setData('connectStartData', {
              x: this.cursor.x,
              y: this.cursor.y,
              obj: this.cursor.getData('connectObj'),
            });
          }
        }
      } else if (ToolClass.prototype instanceof Wheel) {
        if (
          !this.cursor.visible ||
          !(this.cursor.getData('connectObj') instanceof Wheel)
        ) {
          const wheel = new ToolClass(this, x, y);
          wheel.enablePhysics();
          this.parts.add(wheel);

          if (this.cursor.visible) {
            stiffConnect(
              this,
              this.cursor.getData('connectObj').body,
              wheel.body,
              {
                x: wheel.x,
                y: wheel.y,
              },
            );
          }
        }
      }
    });

    this.input.on('pointermove', ({ x, y }) => {
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

      if (this.cursor.visible) {
        x = this.cursor.x;
        y = this.cursor.y;
      }
      if (this.drawLine) {
        // if (this.tool === 'line')
        this.drawLine.line.setEnd(x, y);
        // else this.activateDrawLine();
      }
    });

    this.input.on('pointerup', () => {
      const line = this.activateDrawLine();

      if (line) {
        const startData = line.getData('connectStartData');
        const start = startData && startData.obj;
        const end = this.cursor.visible && this.cursor.getData('connectObj');

        if (start === end) {
          line.destroy();
          return;
        }

        if (start)
          stiffConnect(this, start.body, line.body, {
            x: startData.x,
            y: startData.y,
          });
        if (end)
          stiffConnect(this, end.body, line.body, {
            x: this.cursor.x,
            y: this.cursor.y,
          });
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
    this.toolButtons = PART_TYPES.map((tool, i) => {
      const button = this.add
        .dom(10, 10 + i * 30, 'button', {}, tool)
        .setOrigin(0, 0)
        .setData('tool', tool)
        .addListener('click');
      button.on('click', () => this.setTool(tool));
      this.uiGroup.add(button);
      return button;
    });

    this.setRunning(false);
    this.setTool('wood');

    this.createListeners();
  }
}
