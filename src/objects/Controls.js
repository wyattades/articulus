import Phaser from 'phaser';

export default class Controls extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene, x, y, w, h) {
    super(scene, x, y);
    this.setSize(w, h);
    this.initChildren();
  }

  /**
   * @param {Phaser.Scene} scene
   */
  initChildren() {
    const { scene, width: w, height: h } = this;

    const tl = scene.add.rectangle(0, 0).setOrigin(1, 1);
    const tr = scene.add.rectangle(w, 0).setOrigin(0, 1);
    const bl = scene.add.rectangle(0, h).setOrigin(1, 0);
    const br = scene.add.rectangle(w, h).setOrigin(0, 0);

    const controls = [tl, tr, bl, br];

    for (const c of controls) {
      c.setSize(8, 8)
        .setFillStyle(0xff0000)
        .setInteractive();

      c.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (pointer, ...r) => {
        console.log('down', pointer, ...r);
        // pointer.dragObj = this;
      }).on(Phaser.Input.Events.GAMEOBJECT_MOVE, (...args) => {
        console.log('move', ...args);
      });
    }

    return controls;
  }

  render() {}
}
