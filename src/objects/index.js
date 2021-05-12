import theme from 'src/styles/theme';

import Part from './Part';
import Line from './Line';
import Wheel from './Wheel';
import Thruster from './Thruster';

export { Part, Line, Wheel, Thruster };

export class Water extends Line {
  static type = 'water';
  color = theme.blue;
  noCollide = true;
}

export class Wood extends Line {
  static type = 'wood';
  color = theme.brown;
}

export class BackWheel extends Wheel {
  static type = 'back_wheel';
  spinDir = -1;
  color = theme.pink;
}

export class ForwardWheel extends Wheel {
  static type = 'forward_wheel';
  spinDir = 1;
  color = theme.yellow;
}

export class NeutralWheel extends Wheel {
  static type = 'neutral_wheel';
  spinDir = 0;
  color = theme.blueLight;
}

export const OBJECTS = {
  forward_wheel: ForwardWheel,
  back_wheel: BackWheel,
  neutral_wheel: NeutralWheel,
  wood: Wood,
  water: Water,
  thruster: Thruster,
};
