import Phaser from 'phaser';

export default class Play extends Phaser.Scene {
  constructor(config) {
    super(config);
  }

  preload() {
    const loadingText = this.add.text(100, 300, 'Loading Memes: 0%', {
      fontSize: '40px',
    });
    this.load.on('progress', (value) => {
      loadingText.setText('Loading Memes: ' + parseInt(value * 100) + '%');
    });
    this.load.on('complete', () => {
      loadingText.destroy();
    });

    this.load.image('ball', 'assets/cookie.jpg');
  }

  addLine(x1, y1, x2, y2) {
    const line = this.add.line(x1, y1, 0, 0, x2 - x1, y2 - y1, 0xffffff);
    line.setLineWidth(4);
    line.body.enable = true;
  }

  create() {
    // this.matter.world.setBounds(0, 0, this.game.config.width, this.game.config.height);
    this.matter.world.setBounds(
      0,
      0,
      this.game.config.width,
      this.game.config.height,
      32,
      true,
      true,
      false,
      true,
    );

    // this.addLine(100, 100, 180, 240)
    // this.add.circle(100, 100, 4, 0xff0000);
    // this.add.circle(180, 240, 4, 0xff0000);

    const ball = this.matter.add.circle(100, 200, 40);
    console.log(ball);
    // ball.setVelocity(3, 0);
    ball.friction = 0.005;
    ball.restitution = 1.0;
    // ball.setSize(40, 40).setDisplaySize(40, 40);
    // ball.setCircle();
    // ball.setFriction(0.005).setBounce(1);
  }
}
