import * as _ from 'lodash-es';

import type { Geom } from 'lib/geom';
import { containsGeom, intersectsGeoms } from 'lib/intersects';
import type { Terrain } from 'lib/terrain';
import { BuildZone, type Part } from 'src/objects';

/**
 * If can place `obj`, returns null.
 * Otherwise, returns the object that is blocking.
 */
export const placedPartBlocker = (
  obj: Part,
  {
    objects,
    terrains,
    ignoreObjects,
  }: {
    objects?: Part[];
    terrains?: (Part | Terrain)[];
    ignoreObjects?: Part[];
  },
): Part | Terrain | null => {
  let objGeom: Geom | undefined;
  let partGeom: Geom | undefined;

  if (objects?.length && !obj.noCollide) {
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
    const [buildZones, otherTerrains] = _.partition(
      terrains,
      (t) => t instanceof BuildZone,
    );

    for (const part of otherTerrains) {
      if (
        !part.noCollide &&
        (partGeom ||= part.geom) &&
        intersectsGeoms((objGeom ||= obj.geom), partGeom)
      ) {
        return part;
      }
    }

    // if there are any buildZones, obj MUST be inside one of them
    // TODO: calculate this at the scene level
    if (buildZones.length) {
      for (const part of buildZones) {
        if (containsGeom(part.geom, (objGeom ||= obj.geom))) {
          return null;
        }
      }

      return buildZones[0]; // 0 is arbitrary
    }
  }

  return null;
};
