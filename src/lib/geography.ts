import type { PlaceLocation } from "@/types/place";

/** WKT for PostGIS geography(Point, 4326) — lng first, then lat. */
export function toGeographyPoint({ lng, lat }: PlaceLocation): string {
  return `SRID=4326;POINT(${lng} ${lat})`;
}
