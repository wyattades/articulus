import Phaser from 'phaser';
import * as _ from 'lodash-es';

import { EventManager } from 'lib/utils';

import BoxTool from './BoxTool';

export default class SelectTool extends BoxTool {
  allowStartOverlapping = false;

  get setSelectedEvent() {
    return 'setSelected';
  }

  eventManager = new EventManager()
    .on(this.scene.events, this.setSelectedEvent, this.setSelected.bind(this))
    .on(
      this.scene.input.keyboard,
      'keydown-BACKSPACE',
      this.deleteSelected.bind(this),
    )
    .on(
      this.scene.input.keyboard,
      'keydown-DELETE',
      this.deleteSelected.bind(this),
    );

  shiftKey = this.scene.input.keyboard.addKey(
    Phaser.Input.Keyboard.KeyCodes.SHIFT,
  );

  get currentSelected() {
    return this.scene.selected;
  }
  set currentSelected(next) {
    this.scene.selected = next;
  }

  setSelected(selected) {
    for (const child of _.difference(this.currentSelected, selected)) {
      if (child.scene) child.setHighlight(false);
    }

    for (const child of _.difference(selected, this.currentSelected)) {
      if (child.scene) child.setHighlight(true);
    }

    // Move somewhere else?
    this.currentSelected = selected;
  }

  deleteSelected(evt) {
    evt?.preventDefault();

    for (const obj of this.currentSelected || []) obj.destroy();

    this.scene.events.emit(this.setSelectedEvent, []);
  }

  handleCreateBox(intersected) {
    // only select top object if we are clicking
    if (!this.box.moved && intersected.length > 1) {
      intersected = [intersected[intersected.length - 1]];
    }

    // i.e. intersected is a subset of selected
    const subtract =
      this.currentSelected &&
      this.currentSelected.length > 0 &&
      _.union(this.currentSelected, intersected).length ===
        this.currentSelected.length;

    const newSelected = this.shiftKey.isDown
      ? (subtract ? _.difference : _.union)(
          this.currentSelected || [],
          intersected,
        )
      : intersected;

    this.scene.events.emit(this.setSelectedEvent, newSelected);
  }

  destroy() {
    this.shiftKey.destroy();
    if (this.currentSelected?.length)
      this.scene.events.emit(this.setSelectedEvent, []);
    this.eventManager.off();

    this.currentSelected = [];
  }
}
