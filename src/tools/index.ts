import { COLORS } from 'src/styles/theme';

import DeleteTool from './DeleteTool';
import LineTool from './LineTool';
import PlaceTool from './PlaceTool';
import ShapeTool, { EllipseTool } from './ShapeTool';
import SelectTool from './SelectTool';
import NavTool from './NavTool';
import DragTool from './DragTool';
import ControlsTool from './ControlsTool';
import PenTool from './PenTool';
import EditPointsTool from './EditPointsTool';
import SelectPointsTool from './SelectPointsTool';

export { default as Tool } from './Tool';

export const TOOLS = {
  wood: {
    label: 'Wood Stick',
    color: COLORS.brown,
    ToolClass: LineTool,
  },
  water: {
    label: 'Water Stick',
    color: COLORS.blue,
    ToolClass: LineTool,
  },
  forward_wheel: {
    label: 'Forward Wheel',
    color: COLORS.yellow,
    ToolClass: PlaceTool,
  },
  back_wheel: {
    label: 'Back Wheel',
    color: COLORS.pink,
    ToolClass: PlaceTool,
  },
  neutral_wheel: {
    label: 'Neutral Wheel',
    color: COLORS.blueLight,
    ToolClass: PlaceTool,
  },
  thruster: {
    label: 'Thruster',
    color: COLORS.thrusterFill,
    ToolClass: PlaceTool,
  },
  select: {
    label: 'Select',
    color: COLORS.white,
    ToolClass: SelectTool,
  },
  delete: {
    label: 'Delete',
    color: COLORS.red,
    ToolClass: DeleteTool,
  },

  rectangle_shape: {
    label: 'Rectangle',
    color: COLORS.toolGreen,
    ToolClass: ShapeTool,
  },
  ellipse_shape: {
    label: 'Ellipse',
    color: COLORS.toolGreen,
    ToolClass: EllipseTool,
  },
  polygon_shape: {
    label: 'Pen',
    color: COLORS.toolGreen,
    ToolClass: PenTool,
  },

  // non-UI tools:
  edit_points: {
    ToolClass: EditPointsTool,
  },
  select_points: {
    ToolClass: SelectPointsTool,
  },
  nav: {
    ToolClass: NavTool,
  },
  controls: {
    ToolClass: ControlsTool,
  },
  drag: {
    ToolClass: DragTool,
  },
};

export type ToolKey = keyof typeof TOOLS;

export type ToolClassFor<TK extends ToolKey> = typeof TOOLS[TK]['ToolClass'];

export type ExtraArgsForTool<TK extends ToolKey> =
  ToolClassFor<TK> extends abstract new (
    arg1: any,
    arg2: any,
    ...args: infer P
  ) => any
    ? P
    : never;

export const PLAY_TOOL_TYPES = [
  'wood',
  'water',
  'forward_wheel',
  'back_wheel',
  'neutral_wheel',
  'thruster',
  'select',
  'delete',
] as const;

export const EDITOR_TOOL_TYPES = [
  'rectangle_shape',
  'ellipse_shape',
  'polygon_shape',
  'select',
  'delete',
] as const;
