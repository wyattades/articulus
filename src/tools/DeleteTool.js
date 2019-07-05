import SelectTool from './SelectTool';

export default class DeleteTool extends SelectTool {
  fillColor = 0xff0000;
  // fillOpacity = 0.3;

  setSelected(selected) {
    for (const obj of selected) obj.destroy();
  }
}
