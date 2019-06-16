import Phaser from 'phaser';

const Matter = Phaser.Physics.Matter.Matter;

/**
 * @param {Phaser.Scene} scene
 */
const stiffConnect = (scene, parent, child, options = {}) => {
  const {
    length = 0,
    stiffness = 1,
    group = Matter.Body.nextGroup(true),
    ..._options
  } = options;

  // TODO this doesn't work if multiple connections are made
  parent.collisionFilter.group = group;
  child.collisionFilter.group = group;

  if (!_options.render) _options.render = { visible: true };
  // if (!_options.pointB && b.phaserObject instanceof Line)
  //   _options.pointB = {
  //     x: b.phaserObject.centerX - b.phaserObject.x,
  //     y: b.phaserObject.centerY - b.phaserObject.y,
  //   };

  // child.x =

  _options.pointA = {
    x: child.position.x - parent.position.x,
    y: child.position.y - parent.position.y,
  };

  return scene.matter.add.constraint(
    parent,
    child,
    length,
    stiffness,
    _options,
  );
};

class Wheel extends Phaser.GameObjects.Graphics {
  constructor(scene, x, y, radius = 30) {
    super(scene, { x, y });
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
    this.body.phaserObject = this;

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
    this.body.phaserObject = null; // cleanup for trash collector
    Matter.Events.off(
      this.scene.matter.world.engine,
      'beforeUpdate',
      this.applyTorque,
    );
  }
}

class Line extends Phaser.GameObjects.Graphics {
  static MIN_LENGTH = 40;

  constructor(scene, x1, y1, x2, y2, lineWidth = 10) {
    super(scene, { x: x1, y: y1 });

    scene.add.existing(this);

    this.size = lineWidth;
    this.x1 = x1;
    this.y1 = y1;

    // this.setOrigin(0, 0.5);
    this.setEnd(x2, y2);
  }

  get cosX() {
    return Math.cos(this.rotation) * this.length;
  }

  get cosY() {
    return Math.sin(this.rotation) * this.length;
  }

  // get x1() {
  //   return this.x - this.cosX / 2;
  // }

  // get x2() {
  //   return this.y - this.cosY / 2;
  // }

  get x2() {
    return this.x + this.cosX / 2;
  }

  get y2() {
    return this.y + this.cosY / 2;
  }

  // get centerX() {
  //   return this.x + this.cosX / 2;
  // }

  // get centerY() {
  //   return this.y + this.cosY / 2;
  // }

  // this only works before calling enablePhysics
  setEnd(x2, y2) {
    const { x1, y1 } = this;

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
    this.lineStyle(2, 0x0000ff, 1);
    this.fillStyle(0xffffff);
    this.strokeRoundedRect(
      -this.length / 2 - this.size / 2,
      -this.size / 2,
      this.length + this.size,
      this.size,
      this.size / 2,
    );
    this.fillRoundedRect(
      -this.length / 2 - this.size / 2,
      -this.size / 2,
      this.length + this.size,
      this.size,
      this.size / 2,
    );
    // this.fillCircle(-this.length / 2, 0, this.size / 2);
    // this.fillCircle(this.length / 2, 0, this.size / 2);
  }

  // get length() {
  //   return this.width;
  // }

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
    this.body.phaserObject = this;

    const wheel = new Wheel(this.scene, this.x2, this.y2);
    wheel.enablePhysics();

    // const wheel2 = new Wheel(this.scene, this.centerX, this.centerY);
    // wheel2.enablePhysics();

    // this.scene.matter.add.constraint(wheel.body, this.body, 0, 1, {
    //   render: { visible: false },
    //   pointB: {
    //     x: this.cosX / 2,
    //     y: this.cosY / 2,
    //   },
    // });
    // stiffConnect(this.scene, wheel.body, this.body);
    console.log(stiffConnect(this.scene, this.body, wheel.body));

    return this;
  }

  destroy() {
    super.destroy();
    this.body.phaserObject = null; // cleanup for trash collector
  }
}

export default class Play extends Phaser.Scene {
  preload() {
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

    this.load.image('cookie', 'assets/cookie.png');
  }

  activateDrawLine() {
    if (this.drawLine) {
      this.drawLine.line.enablePhysics();
      this.drawLine = null;
      return true;
    }
    return false;
  }

  createListeners() {
    this.input.on('pointerdown', ({ x, y }) => {
      if (!this.activateDrawLine()) {
        const line = new Line(this, x, y, x, y);
        this.drawLine = { x, y, line };
      }
    });
    this.input.on('pointermove', ({ x, y }) => {
      if (this.drawLine) {
        this.drawLine.line.setEnd(x, y);
      }
    });
    this.input.on('pointerup', () => {
      this.activateDrawLine();
    });
  }

  create() {
    this.matter.world.setBounds(
      0,
      0,
      this.game.config.width,
      this.game.config.height,
      // 32,
      // true,
      // true,
      // false,
      // true,
    );
    // this.addLine(
    //   30,
    //   this.game.config.height - 30,
    //   this.game.config.width - 30,
    //   this.game.config.height - 30,
    // ).enablePhysics(true);

    this.createListeners();
  }
}
