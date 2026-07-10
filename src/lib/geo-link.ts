import type { PlaceLocation } from "@/types/place";

/** RFC 5870 geo URI — opens the device's default maps app at this point. */
export function buildGeoDirectionsHref({ lat, lng }: PlaceLocation): string {
  return `geo:${lat},${lng}`;
}
