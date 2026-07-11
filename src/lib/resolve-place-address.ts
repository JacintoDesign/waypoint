import { reverseGeocode } from "@/lib/geocode";
import { updatePlaceAddress } from "@/queries/places";
import type { Place } from "@/types/place";

/** Fill missing place addresses from coordinates and persist them when possible. */
export async function enrichPlacesWithAddresses(places: Place[]): Promise<Place[]> {
  const enriched: Place[] = [];

  for (const place of places) {
    if (place.address) {
      enriched.push(place);
      continue;
    }

    const address = await reverseGeocode(place.location);
    if (!address) {
      enriched.push(place);
      continue;
    }

    try {
      await updatePlaceAddress(place.id, place.guideId, address);
    } catch {
      // Persistence is best-effort; still show the resolved address.
    }

    enriched.push({ ...place, address });
  }

  return enriched;
}
