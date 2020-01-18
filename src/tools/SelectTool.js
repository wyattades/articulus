import Phaser from 'phaser';
import * as R from 'ramda';

import BoxTool from './BoxTool';

export default class SelectTool extends BoxTool {
  shiftKey = this.scene.input.keyboard.addKey(
    Phaser.Input.Keyboard.KeyCodes.SHIFT,
  );

  allowStartOverlapping = false;

  handleCreateBox(intersected) {
    // only select top object if we are clicking
    if (!this.box.moved && intersected.length > 1)
      intersected = [intersected[intersected.length - 1]];

    const currentSelected = this.scene.selected || [];
    this.scene.selected = this.shiftKey.isDown
      ? R.union(currentSelected, intersected)
      : intersected;

    this.scene.events.emit('setSelected', this.scene.selected);

    for (const child of R.difference(currentSelected, this.scene.selected)) {
      child.setHighlight(false);
    }

    for (const child of R.difference(this.scene.selected, currentSelected)) {
      child.setHighlight(true);
    }
  }
}
