import { COLORS } from 'src/styles/theme';

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

  constructor(...a) {
    super(...a);
    this.color = COLORS.blue;
  }
}

export class Wood extends Line {
  static type = 'wood';

  constructor(...a) {
    super(...a);
    this.color = COLORS.brown;
  }
}

export class BackWheel extends Wheel {
  static type = 'back_wheel';
  spinDir = -1;

  constructor(...a) {
    super(...a);
    this.color = COLORS.pink;
  }
}

export class ForwardWheel extends Wheel {
  static type = 'forward_wheel';
  spinDir = 1;

  constructor(...a) {
    super(...a);
    this.color = COLORS.yellow;
  }
}

export class NeutralWheel extends Wheel {
  static type = 'neutral_wheel';
  spinDir = 0;

  constructor(...a) {
    super(...a);
    this.color = COLORS.blueLight;
  }
}

export const OBJECTS = [
  ForwardWheel,
  BackWheel,
  NeutralWheel,
  Wood,
  Water,
  Thruster,
].reduce((m, el) => {
  m[el.type] = el;
  return m;
}, {});

export const SHAPE_TYPE_CLASSES = [
  Rectangle,
  Ellipse,
  Polygon,
  GoalZone,
].reduce((m, el) => {
  m[el.type] = el;
  return m;
}, {});
