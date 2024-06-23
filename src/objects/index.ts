import { config } from 'src/const';
import { COLORS } from 'src/styles/theme';

import Line from './Line';
import Part from './Part';
import { Polygon } from './Polygon';
import { Ellipse, Rectangle } from './Shape';
import Thruster from './Thruster';
import Wheel from './Wheel';

export { Ellipse, Line, Part, Polygon, Rectangle, Thruster, Wheel };

export class Water extends Line {
  static type = 'water';

  noCollide = true;

  constructor(...a: ConstructorParameters<typeof Line>) {
    super(...a);
    this.color = COLORS.blue;
  }
}

export class Wood extends Line {
  static type = 'wood';

  constructor(...a: ConstructorParameters<typeof Line>) {
    super(...a);
    this.color = COLORS.brown;
  }
}

export class BackWheel extends Wheel {
  static type = 'back_wheel';
  spinDir = -1;

  constructor(...a: ConstructorParameters<typeof Wheel>) {
    super(...a);
    this.color = COLORS.pink;
  }
}

export class ForwardWheel extends Wheel {
  static type = 'forward_wheel';
  spinDir = 1;

  constructor(...a: ConstructorParameters<typeof Wheel>) {
    super(...a);
    this.color = COLORS.yellow;
  }
}

export class NeutralWheel extends Wheel {
  static type = 'neutral_wheel';
  spinDir = 0;

  constructor(...a: ConstructorParameters<typeof Wheel>) {
    super(...a);
    this.color = COLORS.blueLight;
  }
}

export class GoalObject extends Ellipse {
  static type = 'goal_object';

  fillColor = COLORS.goal;
  strokeColor = COLORS.goalBorder;

  width = (this.height = 50 * config.gameScale);

  get physicsOptions(): Phaser.Types.Physics.Matter.MatterBodyConfig | null {
    return {
      density: config.wheel.density,
      friction: config.wheel.friction,
    };
  }

  render() {
    super.render();
    const gfx = this.gfx!;
    gfx.strokeEllipse(0, 0, 36 * config.gameScale, 36 * config.gameScale);
  }
}

export class GoalZone extends Rectangle {
  static type = 'goal_zone' as const;

  static zIndex = 1;

  fillColor = COLORS.goalLight;
  strokeColor = COLORS.goalBorder;
  fillOpacity = 0.5;

  get physicsOptions(): Phaser.Types.Physics.Matter.MatterBodyConfig | null {
    return {
      isStatic: true,
      // sensors trigger collision events, but doesn't react with colliding body physically
      isSensor: true,
    };
  }
}

export class BuildZone extends Rectangle {
  static type = 'build_zone' as const;

  static zIndex = 1;

  fillColor = COLORS.buildZoneLight;
  strokeColor = COLORS.buildZoneBorder;
  fillOpacity = 0.5;

  noCollide = true;
  isGoal = true;

  get physicsOptions(): Phaser.Types.Physics.Matter.MatterBodyConfig | null {
    return {
      isStatic: true,
      // sensors trigger collision events, but doesn't react with colliding body physically
      isSensor: true,
    };
  }
}

export type ObjectType =
  | 'forward_wheel'
  | 'back_wheel'
  | 'neutral_wheel'
  | 'wood'
  | 'water'
  | 'thruster'
  | 'rect'
  | 'ellipse'
  | 'polygon'
  | 'build_zone'
  | 'goal_zone'
  | 'goal_object';

const OBJECTS = [
  ForwardWheel,
  BackWheel,
  NeutralWheel,
  Wood,
  Water,
  Thruster,
  Rectangle,
  Ellipse,
  Polygon,
  BuildZone,
  GoalZone,
  GoalObject,
] as const;

export type ObjectClass = (typeof OBJECTS)[number];

export type ObjectInstance = InstanceType<ObjectClass>;

export const OBJECT_TYPE_MAP = OBJECTS.reduce(
  (m, el) => {
    m[el.type as ObjectType] = el;
    return m;
  },
  {} as Record<ObjectType, ObjectClass>,
);
