import Phaser from 'phaser';
import * as R from 'ramda';

import { EventManager } from 'lib/utils';

import BoxTool from './BoxTool';

export default class SelectTool extends BoxTool {
  shiftKey = this.scene.input.keyboard.addKey(
    Phaser.Input.Keyboard.KeyCodes.SHIFT,
  );

  allowStartOverlapping = false;

  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene, toolKey) {
    super(scene, toolKey);

    this.eventManager = new EventManager()
      .on(scene.events, 'setSelected', this.setSelected)
      .on(scene.input.keyboard, 'keydown-BACKSPACE', this.deleteSelection)
      .on(scene.input.keyboard, 'keydown-DELETE', this.deleteSelection);
  }

  setSelected = (selected) => {
    for (const child of R.difference(this.scene.selected, selected)) {
      if (child.scene) child.setHighlight(false);
    }

    for (const child of R.difference(selected, this.scene.selected)) {
      if (child.scene) child.setHighlight(true);
    }

    // Move somewhere else?
    this.scene.selected = selected;
  };

  deleteSelection = (e) => {
    e.preventDefault();

    for (const obj of this.scene.selected || []) obj.destroy();
  };

  handleCreateBox(intersected) {
    // only select top object if we are clicking
    if (!this.box.moved && intersected.length > 1) {
      intersected = [intersected[intersected.length - 1]];
    }

    // i.e. intersected is a subset of selected
    const subtract =
      this.scene.selected &&
      this.scene.selected.length > 0 &&
      R.union(this.scene.selected, intersected).length ===
        this.scene.selected.length;

    const newSelected = this.shiftKey.isDown
      ? subtract
        ? R.difference(this.scene.selected || [], intersected)
        : R.union(this.scene.selected || [], intersected)
      : intersected;

    this.scene.events.emit('setSelected', newSelected);
  }

  destroy() {
    this.shiftKey.destroy();
    this.scene.events.emit('setSelected', []);
    this.eventManager.off();

    this.scene.selected = [];
  }
}
