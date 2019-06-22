import Part from './Part';
import Line from './Line';
import Wheel from './Wheel';

export { Part, Line, Wheel };

export class Water extends Line {
  type = 'water';
  color = 0x328def;

  enablePhysics() {
    super.enablePhysics();
    this.body.collisionFilter.noCollide = true;
    return this;
  }
}

export class Wood extends Line {
  type = 'wood';
  color = 0xb28325;
}

export class BackWheel extends Wheel {
  type = 'back_wheel';
  spinDir = -1;
  color = 0xe5498d;
}

export class ForwardWheel extends Wheel {
  type = 'forward_wheel';
  color = 0xfff000;
}

// export const PART_TYPES = ['wood', 'water', 'forward_wheel', 'back_wheel'];
// export const PART_CLASSES = {
//   wood: Wood,
//   water: Water,
//   forward_wheel: ForwardWheel,
//   back_wheel: BackWheel,
// };

// export const createObj = (type, ...args) => {
//   const obj = new PART_CLASSES[type](...args);
//   obj.render();
//   return obj;
// };
