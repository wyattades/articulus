import Phaser from 'phaser';

import { Matter, stiffConnect } from '../lib/physics';

class Wheel extends Phaser.GameObjects.Graphics {
  constructor(scene, x, y, radius = 30) {
    super(scene, { x, y });
    this.type = 'wheel';
    scene.add.existing(this);

    this.radius = radius;

    this.fillStyle(0xfff000);
    this.fillCircle(0, 0, radius);
    this.lineStyle(1, 0xff0000);
    this.lineBetween(0, 0, radius, 0);
  }

  enablePhysics(isStatic = false) {
    this.scene.matter.add.gameObject(this, {
      shape: {
        type: 'circle',
        x: this.x,
        y: this.y,
        radius: this.radius,
      },
      isStatic,
    });
    // this.body.phaserObject = this;

    this.body.friction = 0.7;

    Matter.Events.on(
      this.scene.matter.world.engine,
      'beforeUpdate',
      this.applyTorque,
    );
  }

  applyTorque = () => {
    this.body.torque = 0.1;
  };

  destroy() {
    super.destroy();
    // this.body.phaserObject = null; // cleanup for trash collector
    Matter.Events.off(
      this.scene.matter.world.engine,
      'beforeUpdate',
      this.applyTorque,
    );
  }

  getHoverPoint(x, y, dist) {
    if (Phaser.Math.Distance.Between(x, y, this.x, this.y) < dist)
      return { x: this.x, y: this.y };
    return null;
  }
}

class Line extends Phaser.GameObjects.Graphics {
  static MIN_LENGTH = 40;

  constructor(scene, x1, y1, x2, y2, lineWidth = 10) {
    super(scene, { x: x1, y: y1 });
    this.type = 'line';
    scene.add.existing(this);

    this.size = lineWidth;
    this._x1 = x1;
    this._y1 = y1;

    // this.setOrigin(0, 0.5);
    this.setEnd(x2, y2);
  }

  get cosX() {
    return Math.cos(this.rotation) * this.length;
  }

  get cosY() {
    return Math.sin(this.rotation) * this.length;
  }

  get x1() {
    return this.x - this.cosX / 2;
  }

  get y1() {
    return this.y - this.cosY / 2;
  }

  get x2() {
    return this.x + this.cosX / 2;
  }

  get y2() {
    return this.y + this.cosY / 2;
  }

  // this only works before calling enablePhysics
  setEnd(x2, y2) {
    const { _x1: x1, _y1: y1 } = this;

    this.length = Math.max(
      Line.MIN_LENGTH,
      Phaser.Math.Distance.Between(x1, y1, x2, y2),
    );

    this.setRotation(Phaser.Math.Angle.Between(x1, y1, x2, y2));

    this.x = x1 + this.cosX / 2;
    this.y = y1 + this.cosY / 2;
    this.redraw();
    // this.setSize(this.length, this.size);
  }

  redraw() {
    this.clear();
    // this.lineStyle(2, 0x0000ff, 1);
    // this.strokeRoundedRect(
    //   -this.length / 2 - this.size / 2,
    //   -this.size / 2,
    //   this.length + this.size,
    //   this.size,
    //   this.size / 2,
    // );
    this.fillStyle(0xffffff);
    this.fillRoundedRect(
      -this.length / 2 - this.size / 2,
      -this.size / 2,
      this.length + this.size,
      this.size,
      this.size / 2,
    );
  }

  enablePhysics(isStatic = false) {
    // this.setOrigin(0.5, 0.5);
    // this.x += this.cosX / 2;
    // this.y += this.cosY / 2;

    this.scene.matter.add.gameObject(this, {
      shape: {
        type: 'rectangle',
        x: this.x,
        y: this.y,
        width: this.length,
        height: this.size,
      },
      angle: this.rotation,
      isStatic,
    });
    // this.body.phaserObject = this;

    return this;
  }

  getHoverPoint(x, y, dist) {
    const { x1, y1 } = this;
    if (Phaser.Math.Distance.Between(x, y, x1, y1) < dist)
      return { x: x1, y: y1 };
    const { x2, y2 } = this;
    if (Phaser.Math.Distance.Between(x, y, x2, y2) < dist)
      return { x: x2, y: y2 };
    return null;
  }
}

const TOOLS = ['line', 'wheel'];

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
        button.node.textContent === tool ? 'green' : 'white';
  }

  preload() {
    // this.load.image('cookie', 'assets/cookie.png');

    if (this.load.inflight.size > 0) {
      const loadingMsg = (value = 0) =>
        `Loading Assets: ${parseInt(value * 100)}%`;
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
      if (this.tool === 'line') {
        line = this.drawLine.line.enablePhysics();
      } else this.drawLine.line.destroy();
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
      if (this.tool === 'line') {
        if (!lineExisted) {
          const line = new Line(this, x, y, x, y);
          this.drawLine = { x, y, line };
          this.parts.add(line);
        }
      } else if (this.tool === 'wheel') {
        const wheel = new Wheel(this, x, y);
        wheel.enablePhysics();
        this.parts.add(wheel);
        if (this.cursor.visible) {
          stiffConnect(this, this.cursor.getData('connectObj').body, wheel.body);
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
        if (this.tool === 'line') this.drawLine.line.setEnd(x, y);
        else this.activateDrawLine();
      }
    });

    this.input.on('pointerup', () => {
      const line = this.activateDrawLine();

      if (this.cursor.visible && line) {
        stiffConnect(this, this.cursor.getData('connectObj').body, line.body, {
          pointB: {
            x: this.cursor.x,
            y: this.cursor.y,
          }
        });
      }
    });

    this.input.keyboard.addKey('SPACE').on('down', () => {
      this.setRunning(!this.running);
    });

    this.input.keyboard.addKey('R').on('down', () => {
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
    this.toolButtons = TOOLS.map((tool, i) => {
      const button = this.add
        .dom(10, 10 + i * 30, 'button', {}, tool)
        .setOrigin(0, 0)
        .addListener('click');
      button.on('click', () => this.setTool(tool));
      this.uiGroup.add(button);
      return button;
    });

    this.setRunning(false);
    this.setTool('line');

    this.createListeners();
  }
}
