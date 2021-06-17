import theme from 'src/styles/theme';

import Part from './Part';
import Line from './Line';
import Wheel from './Wheel';
import Thruster from './Thruster';

export { Part, Line, Wheel, Thruster };

export class Water extends Line {
  static type = 'water';

  noCollide = true;

  constructor(...a) {
    super(...a);
    this.color = theme.blue;
  }
}

export class Wood extends Line {
  static type = 'wood';

  constructor(...a) {
    super(...a);
    this.color = theme.brown;
  }
}

export class BackWheel extends Wheel {
  static type = 'back_wheel';
  spinDir = -1;

  constructor(...a) {
    super(...a);
    this.color = theme.pink;
  }
}

export class ForwardWheel extends Wheel {
  static type = 'forward_wheel';
  spinDir = 1;

  constructor(...a) {
    super(...a);
    this.color = theme.yellow;
  }
}

export class NeutralWheel extends Wheel {
  static type = 'neutral_wheel';
  spinDir = 0;

  constructor(...a) {
    super(...a);
    this.color = theme.blueLight;
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
