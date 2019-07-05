import DeleteTool from './DeleteTool';
import LineTool from './LineTool';
import PlaceTool from './PlaceTool';
import Tool from './Tool';
import { Part } from '../objects';

export const TOOL_TYPES = [
  'wood',
  'water',
  'forward_wheel',
  'back_wheel',
  'neutral_wheel',
  'delete',
];
/**
 * @type {Object.<string, { label: string, className: string, ToolClass: typeof Tool }>}
 */
export const TOOLS = {
  wood: {
    label: 'Wood Stick',
    className: 'button is-brown',
    ToolClass: LineTool,
  },
  water: {
    label: 'Water Stick',
    className: 'button is-link',
    ToolClass: LineTool,
  },
  forward_wheel: {
    label: 'Forward Wheel',
    className: 'button is-warning',
    ToolClass: PlaceTool,
  },
  back_wheel: {
    label: 'Back Wheel',
    className: 'button is-pink',
    ToolClass: PlaceTool,
  },
  neutral_wheel: {
    label: 'Neutral Wheel',
    className: 'button is-primary',
    ToolClass: PlaceTool,
  },
  delete: {
    label: 'Delete',
    className: 'button is-danger',
    ToolClass: DeleteTool,
  },
};
