import Flatten from '@flatten-js/core';
import * as _ from 'lodash-es';
import Phaser from 'phaser';

import type { Geom } from 'lib/geom';
import { GEOM_NAMES } from 'lib/geom';
import { intersectsGeoms } from 'lib/intersects';
import {
  factoryRotateAround,
  firstIterableValue,
  getEllipsePoints,
  validPoint,
} from 'lib/utils';
import { TEMP_RECT2 } from 'lib/utils/temp';
import type { Part } from 'src/objects';
import type { BaseScene, DebugShapeType } from 'src/scenes/Scene';

import type { Terrain } from '../terrain';

function* iterateBoundPoints(rect: Phaser.Geom.Rectangle, angle: number) {
  const rotateAround = factoryRotateAround(
    { x: rect.centerX ?? rect.x, y: rect.centerY ?? rect.y },
    angle,
  );

  yield rotateAround({ x: rect.left, y: rect.top });
  yield rotateAround({ x: rect.right, y: rect.top });
  yield rotateAround({ x: rect.right, y: rect.bottom });
  yield rotateAround({ x: rect.left, y: rect.bottom });
}

export const getBoundPoints = (
  rect: Phaser.Geom.Rectangle,
  angle: number,
): Point[] => Array.from(iterateBoundPoints(rect, angle));

export const getObjectsBounds = (
  objs: (Phaser.GameObjects.Sprite | Terrain | Part)[],
  bounds = new Phaser.Geom.Rectangle(),
): Phaser.Geom.Rectangle | null => {
  const o = objs[0];
  if (!o) return null;

  bounds.setTo(o.x, o.y, 0, 0);

  for (const obj of objs) {
    const r = obj.rotation ?? 0;
    const b = obj.getBounds(TEMP_RECT2);

    for (const p of iterateBoundPoints(b, r)) {
      if (p.x > bounds.right) bounds.right = p.x;
      if (p.y > bounds.bottom) bounds.bottom = p.y;
      if (p.x < bounds.left) bounds.left = p.x;
      if (p.y < bounds.top) bounds.top = p.y;
    }
  }

  return bounds;
};

export const fitCameraToObjs = (
  camera: Phaser.Cameras.Scene2D.Camera,
  objs: (Part | Terrain | Phaser.GameObjects.Sprite)[],
  { padding = 50, minWidth = 800 } = {},
) => {
  if (objs.length === 0) return;

  const bounds = getObjectsBounds(objs);
  if (!bounds) return;

  if (bounds.width < minWidth) padding += (minWidth - bounds.width) / 2;

  if (padding) {
    bounds.x -= padding;
    bounds.y -= padding;
    bounds.width += padding * 2;
    bounds.height += padding * 2;
  }

  camera.setScroll(
    bounds.centerX - camera.width / 2,
    bounds.centerY - camera.height / 2,
  );
  camera.setZoom(camera.width / bounds.width);
};

export const addHoverCursor = (
  obj: Phaser.GameObjects.Shape,
  cursor: CSSStyleDeclaration['cursor'],
) => {
  const canvas = obj.scene.game.canvas;
  obj
    .on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => {
      canvas.style.cursor = cursor;
    })
    .on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
      canvas.style.cursor = 'auto';
    });
};

const deterministicColor = (seed: string): number => {
  const rng = new Phaser.Math.RandomDataGenerator([seed]);
  return Phaser.Display.Color.HSLToColor(rng.frac(), 1, 0.5).color;
};

export const debugShape = (
  scene: BaseScene,
  key: string,
  obj: Geom | Point | Part,
) => {
  const shape = 'geom' in obj ? obj.geom : obj;

  const run = <G extends DebugShapeType>(
    init: (color: number) => G,
    update?: (shape: G) => void,
  ): G => {
    scene.debugShapes ||= {};

    let prev = scene.debugShapes[key] as G | undefined | null;
    if (!update) {
      prev?.destroy();
      delete scene.debugShapes[key];
      prev = null;
    } else if (prev) {
      update(prev);
      return prev;
    }

    return (scene.debugShapes[key] = init(deterministicColor(key)).setDepth(
      10,
    ) as G);
  };

  if (shape instanceof Phaser.Geom.Rectangle) {
    return run(
      (color) =>
        scene.add
          .rectangle(0, 0, 1, 1, 0, 0)
          .setStrokeStyle(4, color)
          .setOrigin(0, 0),
      (prev) =>
        prev.setPosition(shape.x, shape.y).setSize(shape.width, shape.height),
    );
  } else if (shape instanceof Phaser.Geom.Line) {
    // TODO: how to update line points?

    return run((color) =>
      scene.add
        .line(0, 0, shape.x1, shape.y1, shape.x2, shape.y2)
        .setStrokeStyle(4, color)
        .setOrigin(0, 0),
    );
  } else if (shape instanceof Phaser.Geom.Polygon) {
    // TODO: how to update polygon points?

    return run((color) =>
      scene.add
        .polygon(
          0,
          0,
          shape.points.map((p) => ({ x: p.x, y: p.y })),
          0,
          0,
        )
        .setStrokeStyle(4, color)
        .setOrigin(0, 0),
    );
  } else if (validPoint(shape)) {
    return run(
      (color) => scene.add.circle(0, 0, 4, color, 1),
      (prev) => prev.setPosition(shape.x, shape.y),
    );
  }
  console.warn(`Unsupported debugShape:`, shape);
  return null;
};

export const getTopObject = (scene: BaseScene, x: number, y: number) => {
  const point = new Phaser.Geom.Point(x, y);

  const children = scene.getParts();
  for (let i = children.length - 1; i >= 0; i--) {
    const obj = children[i];

    if (intersectsGeoms(point, obj.geom)) return obj;
  }

  return null;
};

export const mergeGeoms = (
  geoms: (
    | Phaser.Geom.Polygon
    | Phaser.Geom.Rectangle
    | Phaser.Geom.Ellipse
    | Geom
  )[],
): Phaser.Geom.Polygon => {
  if (geoms.length < 2) throw new Error(`mergeGeoms size must be >= 2`);

  let shapes = geoms.map((geom) => {
    if (geom instanceof Phaser.Geom.Polygon)
      return new Flatten.Polygon(geom.points.map((p) => [p.x, p.y]));
    if (geom instanceof Phaser.Geom.Rectangle)
      return new Flatten.Polygon([
        [geom.right, geom.top],
        [geom.right, geom.bottom],
        [geom.left, geom.bottom],
        [geom.left, geom.top],
      ]);
    if (geom instanceof Phaser.Geom.Ellipse)
      return new Flatten.Polygon(
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        getEllipsePoints(geom.x, geom.y, geom.width, geom.height).map((p) => [
          p.x,
          p.y,
        ]),
      );
    throw new Error(
      `Unsupported type in mergeGeoms: ${GEOM_NAMES[(geom as any).type]}`,
    );
  });

  shapes = shapes.map((s) => {
    // make sure all polygons orient the same way (the orientation we choose is arbitrary)
    const orient = firstIterableValue(s.faces).orientation();
    if (orient === Flatten.ORIENTATION.CW) {
      return s.reverse();
    }

    return s;
  });

  let merged = shapes
    .slice(1)
    .reduce((a, b) => Flatten.BooleanOperations.unify(a, b), shapes[0]);

  // this seems to fix the faces after merging:
  try {
    merged = merged.splitToIslands()[0];
  } catch {}

  if (!merged.isValid()) console.warn('Merged polygon is not valid');

  return new Phaser.Geom.Polygon(merged.vertices);
};

export const groupByIntersection = (objs: Part[]): Part[][] => {
  const intersects = _.memoize(
    (a, b) => intersectsGeoms(a.geom, b.geom),
    (a, b) => [a.id, b.id].sort().join(':'),
  );

  const ungrouped = [...objs];

  const groups: Part[][] = [];

  // eslint-disable-next-line no-restricted-syntax
  outer: while (ungrouped.length > 0) {
    const a = ungrouped.pop()!;
    for (const g of groups) {
      for (const b of g) {
        if (intersects(a, b)) {
          g.push(a);
          continue outer;
        }
      }
    }
    for (const b of ungrouped) {
      if (intersects(a, b)) {
        _.pull(ungrouped, b); // remove b from `ungrouped`
        groups.push([a, b]);
        continue outer;
      }
    }

    // `a` has no intersections
    groups.push([a]);
  }

  return groups;
};

export const intersectsOtherSolid = (
  objects: Part[],
  terrains: Terrain[] | undefined | null,
  obj: Part,
  ignoreObjects?: Part[],
): Part | Terrain | null => {
  let objGeom;

  if (!obj.noCollide) {
    for (const part of objects) {
      if (
        !part.noCollide &&
        part !== obj &&
        !ignoreObjects?.includes(part) &&
        intersectsGeoms((objGeom ||= obj.geom), part.geom)
      ) {
        return part;
      }
    }
  }

  if (terrains?.length) {
    for (const part of terrains) {
      if (part.geom && intersectsGeoms((objGeom ||= obj.geom), part.geom)) {
        return part;
      }
    }
  }

  return null;
};
