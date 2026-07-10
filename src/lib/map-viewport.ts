import type { Place, PlaceLocation } from "@/types/place";

export const DEFAULT_MAP_CENTER: [number, number] = [0, 20];
export const DEFAULT_MAP_ZOOM = 1.5;
export const SINGLE_PLACE_ZOOM = 13;

export type MapLngLatBounds = [[number, number], [number, number]];

export type MapViewport =
  | { kind: "center"; center: [number, number]; zoom: number }
  | { kind: "bounds"; bounds: MapLngLatBounds };

export type PlaceWithLocation = Pick<Place, "location">;

export function toLngLat({ lng, lat }: PlaceLocation): [number, number] {
  return [lng, lat];
}

function boundsFromPlaces(places: PlaceWithLocation[]): MapLngLatBounds {
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;

  for (const place of places) {
    const [lng, lat] = toLngLat(place.location);
    west = Math.min(west, lng);
    south = Math.min(south, lat);
    east = Math.max(east, lng);
    north = Math.max(north, lat);
  }

  return [
    [west, south],
    [east, north],
  ];
}

export function getMapViewportFromPlaces(
  places: PlaceWithLocation[],
): MapViewport {
  if (places.length === 0) {
    return {
      kind: "center",
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
    };
  }

  if (places.length === 1) {
    return {
      kind: "center",
      center: toLngLat(places[0].location),
      zoom: SINGLE_PLACE_ZOOM,
    };
  }

  return {
    kind: "bounds",
    bounds: boundsFromPlaces(places),
  };
}

export function viewportKey(places: PlaceWithLocation[]): string {
  return places
    .map((place) => {
      const [lng, lat] = toLngLat(place.location);
      return `${lng},${lat}`;
    })
    .join("|");
}
