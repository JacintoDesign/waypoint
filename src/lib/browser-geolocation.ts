import { isValidPlaceLocation } from "@/lib/place-location";
import type { PlaceLocation } from "@/types/place";

/** Read the browser's current position when the user grants permission. */
export function getCurrentPlaceLocation(): Promise<PlaceLocation | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: PlaceLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        resolve(isValidPlaceLocation(location) ? location : null);
      },
      () => resolve(null),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10_000,
      },
    );
  });
}
