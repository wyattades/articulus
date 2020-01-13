import DeleteTool from './DeleteTool';
import LineTool from './LineTool';
import PlaceTool from './PlaceTool';
import ShapeTool, { EllipseTool } from './ShapeTool';
import SelectTool from './SelectTool';
import NavTool from './NavTool';
import DragTool from './DragTool';
import theme from '../styles/theme';

export const PLAY_TOOL_TYPES = [
  'wood',
  'water',
  'forward_wheel',
  'back_wheel',
  'neutral_wheel',
  'select',
  'delete',
];

export const EDITOR_TOOL_TYPES = [
  'rectangle_shape',
  'ellipse_shape',
  'select',
  'delete',
];

/**
 * @type {Object.<string, { label: string, className: string, ToolClass: typeof import('./Tool').default }>}
 */
export const TOOLS = {
  wood: {
    label: 'Wood Stick',
    color: theme.brown,
    ToolClass: LineTool,
  },
  water: {
    label: 'Water Stick',
    color: theme.blue,
    ToolClass: LineTool,
  },
  forward_wheel: {
    label: 'Forward Wheel',
    color: theme.yellow,
    ToolClass: PlaceTool,
  },
  back_wheel: {
    label: 'Back Wheel',
    color: theme.pink,
    ToolClass: PlaceTool,
  },
  neutral_wheel: {
    label: 'Neutral Wheel',
    color: theme.blueLight,
    ToolClass: PlaceTool,
  },
  select: {
    label: 'Select',
    color: theme.white,
    ToolClass: SelectTool,
  },
  delete: {
    label: 'Delete',
    color: theme.red,
    ToolClass: DeleteTool,
  },
  rectangle_shape: {
    label: 'Rectangle',
    color: theme.white,
    ToolClass: ShapeTool,
  },
  ellipse_shape: {
    label: 'Ellipse',
    color: theme.white,
    ToolClass: EllipseTool,
  },

  // non-UI tools:
  nav: {
    ToolClass: NavTool,
  },
  drag: {
    ToolClass: DragTool,
  },
};
