import type { PlaceLocation } from "@/types/place";

export function isValidPlaceLocation(
  location: PlaceLocation | null | undefined,
): location is PlaceLocation {
  if (!location) {
    return false;
  }

  const { lat, lng } = location;
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}
