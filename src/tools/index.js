import DeleteTool from './DeleteTool';
import LineTool from './LineTool';
import PlaceTool from './PlaceTool';
import Tool from './Tool';
import { Part, BackWheel, ForwardWheel, Water, Wood } from '../objects';

export const TOOL_TYPES = [
  'wood',
  'water',
  'forward_wheel',
  'back_wheel',
  'delete',
];
/**
 * @type {Object.<string, { label: string, PartClass: typeof Part, ToolClass: typeof Tool }>}
 */
export const TOOLS = {
  wood: {
    label: 'Wood Stick',
    className: 'button',
    PartClass: Wood,
    ToolClass: LineTool,
  },
  water: {
    label: 'Water Stick',
    className: 'button',
    PartClass: Water,
    ToolClass: LineTool,
  },
  forward_wheel: {
    label: 'Forward Wheel',
    className: 'button',
    PartClass: ForwardWheel,
    ToolClass: PlaceTool,
  },
  back_wheel: {
    label: 'Back Wheel',
    className: 'button',
    PartClass: BackWheel,
    ToolClass: PlaceTool,
  },
  delete: {
    label: 'Delete',
    className: 'button is-danger',
    PartClass: null,
    ToolClass: DeleteTool,
  },
};
