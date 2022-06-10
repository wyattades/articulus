import Phaser from 'phaser';

import { config } from 'src/const';
import { getEllipsePoints } from 'lib/utils';
import { COLORS } from 'src/styles/theme';

import Part from './Part';

export abstract class Shape extends Part {
  fillColor = COLORS.shapeFill;
  fillOpacity = 1;
  strokeColor = 0xffffff;
  strokeOpacity = 1;
  strokeWidth = 2;
  width = 1;
  height = 1;
  originX = 0.5;
  originY = 0.5;

  get physicsOptions(): Phaser.Types.Physics.Matter.MatterBodyConfig | null {
    return {
      density: config.physics.landDensity,
      isStatic: true,
    };
  }
}

export class Rectangle extends Shape {
  static type = 'rect';

  render() {
    const gfx = this.gfx!;
    gfx.fillStyle(this.fillColor, this.fillOpacity);
    gfx.lineStyle(this.strokeWidth, this.strokeColor, this.strokeOpacity);
    gfx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    gfx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
  }

  get physicsShape(): FC.PhysicsShape {
    return 'rectangle';
  }
}

export class GoalZone extends Rectangle {
  static type = 'goal_zone';

  static zIndex = 1;

  fillColor = COLORS.goalLight;
  strokeColor = COLORS.goalBorder;
  fillOpacity = 0.5;

  // disable physics
  get physicsShape(): FC.PhysicsShape {
    return null;
  }
}

export class Ellipse extends Rectangle {
  static type = 'ellipse';

  render() {
    const gfx = this.gfx!;
    gfx.fillStyle(this.fillColor, this.fillOpacity);
    gfx.lineStyle(this.strokeWidth, this.strokeColor, this.strokeOpacity);
    gfx.fillEllipse(0, 0, this.width, this.height);
    gfx.strokeEllipse(0, 0, this.width, this.height);
  }

  get geom() {
    if (!this.rotation || this.width === this.height) {
      return new Phaser.Geom.Ellipse(this.x, this.y, this.width, this.height);
    } else {
      return new Phaser.Geom.Polygon(
        getEllipsePoints(
          this.x,
          this.y,
          this.width,
          this.height,
          this.rotation,
        ),
      );
    }
  }

  get physicsShape(): FC.PhysicsShape {
    if (this.width === this.height)
      return {
        type: 'circle',
        radius: this.width / 2,
      };

    return {
      type: 'fromVertices',
      verts: getEllipsePoints(0, 0, this.width, this.height, 0, 16),
    };
  }
}
