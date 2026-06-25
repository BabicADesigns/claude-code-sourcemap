export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface MapProjection {
  width: number;
  height: number;
  project(point: LatLng): Point2D;
}

/**
 * Equirectangular projection corrected for east-west stretching at this latitude band
 * (longitude degrees are scaled by cos(midLatitude) before fitting), then scaled
 * uniformly to fit a padded width/height box. Good enough for the short Balkan coastal
 * spans this app draws — not meant for anything near the poles or full-globe extents.
 */
export function createMapProjection(points: LatLng[], width: number, height: number, padding = 24): MapProjection {
  if (points.length === 0) {
    return { width, height, project: () => ({ x: width / 2, y: height / 2 }) };
  }

  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const midLatRad = ((minLat + maxLat) / 2) * (Math.PI / 180);
  const lngScale = Math.max(Math.cos(midLatRad), 0.1);

  const lngSpan = Math.max((maxLng - minLng) * lngScale, 0.001);
  const latSpan = Math.max(maxLat - minLat, 0.001);

  const innerWidth = Math.max(width - padding * 2, 1);
  const innerHeight = Math.max(height - padding * 2, 1);
  const scale = Math.min(innerWidth / lngSpan, innerHeight / latSpan);

  const projectedWidth = lngSpan * scale;
  const projectedHeight = latSpan * scale;
  const offsetX = padding + (innerWidth - projectedWidth) / 2;
  const offsetY = padding + (innerHeight - projectedHeight) / 2;

  return {
    width,
    height,
    project({ latitude, longitude }) {
      return {
        x: offsetX + (longitude - minLng) * lngScale * scale,
        // Latitude increases northward; SVG y increases downward, so invert.
        y: offsetY + (maxLat - latitude) * scale,
      };
    },
  };
}
