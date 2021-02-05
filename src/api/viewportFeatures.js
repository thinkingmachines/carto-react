// import {pointToTile} from '@mapbox/tilebelt';
import bboxPolygon from '@turf/bbox-polygon';
import intersects from '@turf/boolean-intersects';

// function getTilesInViewport(viewport, zoom) {

//   const [minX, minY, maxX, maxY] = viewport;
//   const tiles = [];
//   const tileMin = pointToTile(minX, minY, zoom);
//   const tileMax = pointToTile(maxX, maxY, zoom);

//   for (let x=tileMin[0]; x<=tileMax[0]; x++){
//     for (let y=tileMax[1]; y<=tileMin[1]; y++) {
//       tiles.push({x, y});
//     }
//   }

//   return tiles;
// }

// Clip the viewport with the tile and transform to tile coordinates [0..1]
function prepareViewport(tile, viewport) {
  // Clip viewport with the tile
  const minX = Math.max(tile.bbox.west, viewport[0]);
  const minY = Math.max(tile.bbox.south, viewport[1]);
  const maxX = Math.min(tile.bbox.east, viewport[2]);
  const maxY = Math.min(tile.bbox.north, viewport[3]);

  // Transform to tile coordinates, between 0..1
  const tMinX = (minX - tile.bbox.west) / (tile.bbox.east - tile.bbox.west);
  const tMaxX = (maxX - tile.bbox.west) / (tile.bbox.east - tile.bbox.west);
  const tMinY = (minY - tile.bbox.north) / (tile.bbox.south - tile.bbox.north);
  const tMaxY = (maxY - tile.bbox.north) / (tile.bbox.south - tile.bbox.north);

  return [tMinX, tMinY, tMaxX, tMaxY];
}

function addIntersectedFeaturesInTile({ map, tile, viewport, uniqueId }) {
  const viewportIntersection = bboxPolygon(prepareViewport(tile, viewport));

  for (const f of tile.data) {
    // Add if the feature was not previously intersected and intersects with the viewport
    if (!map.has(f.properties[uniqueId]) && intersects(f, viewportIntersection)) {
      map.set(f.properties[uniqueId], f.properties);
    }
  }
}

export function viewportFeatures({ tiles, viewport, uniqueId }) {
  // const viewPortTiles = getTilesInViewport(viewport, tiles[0].z);
  const [minX, minY, maxX, maxY] = viewport;

  const map = new Map();

  for (const tile of tiles) {
    // Discard if it's not a visible tile
    if (!tile.isVisible) {
      // viewPortTiles.find(t => t.x === tile.x && t.y === tile.y) === undefined) {
      continue;
    }

    const bbox = tile.bbox;
    const fullVisible =
      bbox.west >= minX && bbox.east <= maxX && bbox.north <= maxY && bbox.south >= minY;

    tile.fullVisible = fullVisible;
    if (tile.fullVisible) {
      // All the features of the tile are visible
      for (const f of tile.data) {
        const prop = f.properties;
        if (!map.has(prop[uniqueId])) {
          map.set(prop[uniqueId], prop);
        }
      }
    } else {
      addIntersectedFeaturesInTile({ map, tile, viewport, uniqueId });
    }
  }

  return Array.from(map.values());
}
