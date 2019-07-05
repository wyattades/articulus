import Part from './Part';
import Line from './Line';
import Wheel from './Wheel';

export { Part, Line, Wheel };

export class Water extends Line {
  static type = 'water';
  color = 0x328def;
  noCollide = true;
}

export class Wood extends Line {
  static type = 'wood';
  color = 0xb28325;
}

export class BackWheel extends Wheel {
  static type = 'back_wheel';
  spinDir = -1;
  color = 0xe5498d;
}

export class ForwardWheel extends Wheel {
  static type = 'forward_wheel';
  spinDir = 1;
  color = 0xfff000;
}

export class NeutralWheel extends Wheel {
  static type = 'neutral_wheel';
  spinDir = 0;
  color = 0x3dd0f5;
}

export const OBJECTS = {
  forward_wheel: ForwardWheel,
  back_wheel: BackWheel,
  neutral_wheel: NeutralWheel,
  wood: Wood,
  water: Water,
};
