import exifr from "exifr";
import type { PlaceLocation } from "@/types/place";
import { parseGpsFromMetadataTags } from "@/lib/parse-gps-coords";
import { isValidPlaceLocation } from "@/lib/place-location";

const GPS_PARSE_OPTIONS = {
  gps: true,
  xmp: true,
  tiff: false,
  ifd1: false,
  exif: false,
  iptc: false,
  icc: false,
} as const;

function parseGpsOutput(
  gps: { latitude?: unknown; longitude?: unknown } | null | undefined,
): PlaceLocation | null {
  if (!gps) {
    return null;
  }

  const location: PlaceLocation = {
    lat: typeof gps.latitude === "number" ? gps.latitude : Number.NaN,
    lng: typeof gps.longitude === "number" ? gps.longitude : Number.NaN,
  };

  return isValidPlaceLocation(location) ? location : null;
}

/** Read GPS coordinates from image EXIF. Returns null when absent or invalid. */
export async function extractGpsFromFile(
  file: File,
): Promise<PlaceLocation | null> {
  try {
    const fromGps = parseGpsOutput(await exifr.gps(file));
    if (fromGps) {
      return fromGps;
    }

    const revivedTags = await exifr.parse(file, GPS_PARSE_OPTIONS);
    const fromRevivedTags = parseGpsFromMetadataTags(revivedTags);
    if (fromRevivedTags) {
      return fromRevivedTags;
    }

    const rawTags = await exifr.parse(file, {
      ...GPS_PARSE_OPTIONS,
      reviveValues: false,
      sanitize: false,
    });
    return parseGpsFromMetadataTags(rawTags);
  } catch {
    return null;
  }
}
