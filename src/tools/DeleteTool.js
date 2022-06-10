import BoxTool from './BoxTool';

export default class DeleteTool extends BoxTool {
  fillColor = 0xff0000;
  // fillOpacity = 0.3;

  handleCreateBox() {
    for (const obj of this.getBoxIntersections()) obj.destroy();
    this.scene.events.emit('setSelected', []);
  }
}
