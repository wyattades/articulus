import Phaser from 'phaser';

import { RotatedRect, ROTATED_RECT } from 'lib/rotatedRect';

const G = { ...Phaser.Geom, ROTATED_RECT, RotatedRect };

export const GEOM_TYPES = {
  [G.CIRCLE]: G.Circle,
  [G.ELLIPSE]: G.Ellipse,
  [G.LINE]: G.Line,
  [G.POINT]: G.Point,
  [G.POLYGON]: G.Polygon,
  [G.RECTANGLE]: G.Rectangle,
  [G.ROTATED_RECT]: G.RotatedRect,
};

// TODO: transforms!

type OriginPoint = {
  x: '0%' | '50%' | '100%' | number;
  y: '0%' | '50%' | '100%' | number;
};
type TransformOp =
  | {
      origin?: OriginPoint;
      scale: Vector2;
    }
  | {
      translate: Vector2;
    }
  | {
      origin?: OriginPoint;
      rotate: number;
    };

type Geom = InstanceType<typeof GEOM_TYPES[keyof typeof GEOM_TYPES]>;

export const transform = (geom: Geom, ops: TransformOp[]) => {
  if (geom instanceof G.RotatedRect) {
    return geom;
  }
  throw new Error(`Unsupported transform geom: ${geom.constructor.name}`);
};
