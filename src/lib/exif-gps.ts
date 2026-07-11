import exifr from "exifr";
import type { PlaceLocation } from "@/types/place";

/** Read GPS coordinates from image EXIF. Returns null when absent or invalid. */
export async function extractGpsFromFile(
  file: File,
): Promise<PlaceLocation | null> {
  try {
    const gps = await exifr.gps(file);
    if (!gps || typeof gps.latitude !== "number" || typeof gps.longitude !== "number") {
      return null;
    }

    const { latitude: lat, longitude: lng } = gps;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return null;
    }

    return { lat, lng };
  } catch {
    return null;
  }
}
