import * as _ from 'lodash-es';

import type { Part } from 'src/objects';

import BoxTool from './BoxTool';

export default class SelectTool extends BoxTool {
  allowStartOverlapping = false;

  _em = this.eventManager
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

  get setSelectedEvent() {
    return 'setSelected';
  }
  get currentSelected() {
    return this.scene.selected;
  }
  set currentSelected(next) {
    this.scene.selected = next;
  }

  setSelected(selected: Part[]) {
    for (const child of _.difference(this.currentSelected, selected)) {
      if (child.scene) child.setHighlight(false);
    }

    for (const child of _.difference(selected, this.currentSelected || [])) {
      if (child.scene) child.setHighlight(true);
    }

    // Move somewhere else?
    this.currentSelected = selected;
  }

  deleteSelected(evt?: KeyboardEvent) {
    evt?.preventDefault();

    for (const obj of this.currentSelected || []) obj.destroy();

    this.scene.events.emit(this.setSelectedEvent, []);
  }

  handleCreateBox() {
    let intersected = this.getBoxIntersections();

    // only select top object if we are clicking
    if (!this.box!.moved && intersected.length > 1) {
      intersected = [intersected[intersected.length - 1]];
    }

    // i.e. intersected is a subset of selected
    const subtract =
      this.currentSelected &&
      this.currentSelected.length > 0 &&
      _.union(this.currentSelected, intersected).length ===
        this.currentSelected.length;

    const newSelected = this.scene.modifierKey.isDown
      ? (subtract ? _.difference : _.union)(
          this.currentSelected || [],
          intersected,
        )
      : intersected;

    this.scene.events.emit(this.setSelectedEvent, newSelected);
  }

  destroy() {
    super.destroy();

    if (this.currentSelected?.length)
      this.scene.events.emit(this.setSelectedEvent, []);

    this.currentSelected = [];
  }
}
