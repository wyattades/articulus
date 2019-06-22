import SelectTool from './SelectTool';
import { deleteConnections } from '../lib/physics';

export default class DeleteTool extends SelectTool {
  fillColor = 0xff0000;
  // fillOpacity = 0.3;

  setSelected(selected) {
    for (const obj of selected) {
      deleteConnections(this.scene, obj.body);
      obj.destroy();
    }
  }
}
