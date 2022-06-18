import { COLORS } from 'src/styles/theme';
import { config } from 'src/const';

import Part from './Part';
import Line from './Line';
import Wheel from './Wheel';
import Thruster from './Thruster';
import { Ellipse, Rectangle, GoalZone } from './Shape';
import { Polygon } from './Polygon';

export { Part, Line, Wheel, Thruster, Rectangle, Ellipse, Polygon, GoalZone };

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
  GoalZone,
  GoalObject,
] as const;

export type ObjectType = typeof OBJECTS[number];

export type ObjectInstance = InstanceType<ObjectType>;

export const OBJECT_TYPE_MAP = OBJECTS.reduce((m, el) => {
  m[el.type] = el;
  return m;
}, {} as Record<string, ObjectType>);
