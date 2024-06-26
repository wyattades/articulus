import {
  BackWheel,
  BuildZone,
  Ellipse,
  ForwardWheel,
  GoalObject,
  GoalZone,
  NeutralWheel,
  Polygon,
  Rectangle,
  Thruster,
  Water,
  Wood,
} from 'src/objects';
import { COLORS } from 'src/styles/theme';

import ControlsTool from './ControlsTool';
import DeleteTool from './DeleteTool';
import DragTool from './DragTool';
import EditPointsTool from './EditPointsTool';
import LineTool from './LineTool';
import NavTool from './NavTool';
import PenTool from './PenTool';
import PlaceTool from './PlaceTool';
import SelectPointsTool from './SelectPointsTool';
import SelectTool from './SelectTool';
import ShapeTool, { EllipseTool } from './ShapeTool';

export { default as Tool } from './Tool';

export const TOOLS = {
  wood: {
    label: 'Wood Stick',
    color: COLORS.brown,
    ToolClass: LineTool,
    ShapeClass: Wood,
  },
  water: {
    label: 'Water Stick',
    color: COLORS.blue,
    ToolClass: LineTool,
    ShapeClass: Water,
  },
  forward_wheel: {
    label: 'Forward Wheel',
    color: COLORS.yellow,
    ToolClass: PlaceTool,
    ShapeClass: ForwardWheel,
  },
  back_wheel: {
    label: 'Back Wheel',
    color: COLORS.pink,
    ToolClass: PlaceTool,
    ShapeClass: BackWheel,
  },
  neutral_wheel: {
    label: 'Neutral Wheel',
    color: COLORS.blueLight,
    ToolClass: PlaceTool,
    ShapeClass: NeutralWheel,
  },
  thruster: {
    label: 'Thruster',
    color: COLORS.thrusterFill,
    ToolClass: PlaceTool,
    ShapeClass: Thruster,
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

  goal_object: {
    label: 'Goal Object',
    color: COLORS.goal,
    ToolClass: PlaceTool,
    ShapeClass: GoalObject,
  },
  goal_zone: {
    label: 'Goal Zone',
    color: COLORS.goalLight,
    ToolClass: ShapeTool,
    ShapeClass: GoalZone,
  },
  build_zone: {
    label: 'Build Zone',
    color: COLORS.buildZoneLight,
    ToolClass: ShapeTool,
    ShapeClass: BuildZone,
  },
  rectangle_shape: {
    label: 'Rectangle',
    color: COLORS.toolGreen,
    ToolClass: ShapeTool,
    ShapeClass: Rectangle,
  },
  ellipse_shape: {
    label: 'Ellipse',
    color: COLORS.toolGreen,
    ToolClass: EllipseTool,
    ShapeClass: Ellipse,
  },
  polygon_shape: {
    label: 'Pen',
    color: COLORS.toolGreen,
    ToolClass: PenTool,
    ShapeClass: Polygon,
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

export type ToolClassFor<TK extends ToolKey> = (typeof TOOLS)[TK]['ToolClass'];

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
] as const satisfies ToolKey[];

export const EDITOR_TOOL_TYPES = [
  'rectangle_shape',
  'ellipse_shape',
  'polygon_shape',
  'build_zone',
  'goal_zone',
  'goal_object',
  'select',
  'delete',
] as const satisfies ToolKey[];
