import BoxTool from './BoxTool';

export default class DeleteTool extends BoxTool {
  fillColor = 0xff0000;
  // fillOpacity = 0.3;

  handleCreateBox(intersected) {
    for (const obj of intersected) obj.destroy();
  }
}
