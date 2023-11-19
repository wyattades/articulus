import * as _ from 'lodash-es';
import Phaser from 'phaser';

import { ROTATED_RECT, RotatedRect } from 'lib/rotatedRect';

const G = { ...Phaser.Geom, ROTATED_RECT, RotatedRect };

export const GEOM_NAMES = {
  [G.CIRCLE]: 'Circle',
  [G.ELLIPSE]: 'Ellipse',
  [G.LINE]: 'Line',
  [G.POINT]: 'Point',
  [G.POLYGON]: 'Polygon',
  [G.RECTANGLE]: 'Rectangle',
  [G.ROTATED_RECT]: 'RotatedRect',
} as const;

export const GEOM_TYPES = _.mapValues(
  GEOM_NAMES,
  (name) => G[name as (typeof GEOM_NAMES)[keyof typeof GEOM_NAMES]],
);

export type GeomType = (typeof GEOM_TYPES)[keyof typeof GEOM_TYPES];
export type Geom = InstanceType<GeomType>;

// TODO: transforms!

// type OriginPoint = {
//   x: '0%' | '50%' | '100%' | number;
//   y: '0%' | '50%' | '100%' | number;
// };
// type TransformOp =
//   | {
//       origin?: OriginPoint;
//       scale: Vector2;
//     }
//   | {
//       translate: Vector2;
//     }
//   | {
//       origin?: OriginPoint;
//       rotate: number;
//     };

// export const transform = (geom: Geom, ops: TransformOp[]) => {
//   if (geom instanceof G.RotatedRect) {
//     return geom;
//   }
//   throw new Error(`Unsupported transform geom: ${geom.type}`);
// };
