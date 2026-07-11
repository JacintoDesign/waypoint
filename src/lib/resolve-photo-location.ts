import { extractGpsFromFile } from "@/lib/exif-gps";
import { forwardGeocode } from "@/lib/geocode";
import { buildGeocodeQueryFromFilename } from "@/lib/photo-filename-location";
import type { PlaceLocation } from "@/types/place";

export type PhotoLocationSuggestion = {
  location: PlaceLocation;
  source: "exif" | "filename";
  query?: string;
};

export async function resolvePhotoLocationFromExif(
  file: File,
): Promise<PhotoLocationSuggestion | null> {
  const location = await extractGpsFromFile(file);
  if (!location) {
    return null;
  }

  return { location, source: "exif" };
}

export async function resolvePhotoLocationFromFilename(
  filename: string,
): Promise<PhotoLocationSuggestion | null> {
  const query = buildGeocodeQueryFromFilename(filename);
  if (!query) {
    return null;
  }

  const response = await fetch(`/api/geocode?${new URLSearchParams({ q: query })}`);
  if (!response.ok) {
    return null;
  }

  const body = (await response.json()) as { location: PlaceLocation | null };
  if (!body.location) {
    return null;
  }

  return {
    location: body.location,
    source: "filename",
    query,
  };
}

/** Resolve a photo location from EXIF GPS, then filename geocoding. */
export async function resolvePhotoLocation(
  file: File,
): Promise<PhotoLocationSuggestion | null> {
  const fromExif = await resolvePhotoLocationFromExif(file);
  if (fromExif) {
    return fromExif;
  }

  return resolvePhotoLocationFromFilename(file.name);
}
