import Part from './Part';
import Line from './Line';
import Wheel from './Wheel';

export { Part, Line, Wheel };

export class Wood extends Line {
  type = 'wood';
  fillColor = 0xb28325;
}

export class Water extends Line {
  type = 'water';
  fillColor = 0x328def;

  enablePhysics() {
    super.enablePhysics();
    this.body.collisionFilter.noCollide = true;
    return this;
  }
}

export class BackWheel extends Wheel {
  type = 'back_wheel';
  spinDir = -1;
  fillColor = 0xe5498d;
}

export class ForwardWheel extends Wheel {
  type = 'forward_wheel';
}

export const PART_TYPES = ['wood', 'water', 'forward_wheel', 'back_wheel'];
export const PART_CLASSES = {
  wood: Wood,
  water: Water,
  forward_wheel: ForwardWheel,
  back_wheel: BackWheel,
};
