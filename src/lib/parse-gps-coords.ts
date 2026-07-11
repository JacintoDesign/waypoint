import { isValidPlaceLocation } from "@/lib/place-location";
import type { PlaceLocation } from "@/types/place";

type GpsTagRecord = Record<string, unknown>;

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") {
      return null;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function rationalToNumber(value: unknown): number | null {
  if (Array.isArray(value) && value.length === 2) {
    const numerator = toFiniteNumber(value[0]);
    const denominator = toFiniteNumber(value[1]);
    if (numerator === null || denominator === null || denominator === 0) {
      return null;
    }

    return numerator / denominator;
  }

  return toFiniteNumber(value);
}

function normalizeRef(ref: unknown): "N" | "S" | "E" | "W" | undefined {
  if (typeof ref !== "string") {
    return undefined;
  }

  const direction = ref.trim().charAt(0).toUpperCase();
  if (direction === "N" || direction === "S" || direction === "E" || direction === "W") {
    return direction;
  }

  return undefined;
}

function applyRef(decimal: number, ref: "N" | "S" | "E" | "W" | undefined): number {
  if (ref === "S" || ref === "W") {
    return -Math.abs(decimal);
  }

  return decimal;
}

/** Convert EXIF DMS arrays, rationals, or decimal values to signed decimal degrees. */
export function dmsToDecimal(value: unknown, ref: unknown): number | null {
  const direction = normalizeRef(ref);
  const asDecimal = toFiniteNumber(value);

  if (asDecimal !== null) {
    return applyRef(asDecimal, direction);
  }

  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const parts = value.map(rationalToNumber);
  if (parts.some((part) => part === null)) {
    return null;
  }

  const [degrees, minutes = 0, seconds = 0] = parts;
  if (degrees === null || minutes === null || seconds === null) {
    return null;
  }

  const decimal = degrees + minutes / 60 + seconds / 3600;
  return applyRef(decimal, direction);
}

function parseCoordinatePair(lat: unknown, lng: unknown): PlaceLocation | null {
  const latNum = toFiniteNumber(lat);
  const lngNum = toFiniteNumber(lng);
  if (latNum === null || lngNum === null) {
    return null;
  }

  const location = { lat: latNum, lng: lngNum };
  return isValidPlaceLocation(location) ? location : null;
}

function parseGpsPosition(value: unknown): PlaceLocation | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  const pairMatch = trimmed.match(/^([+-]?\d+(?:\.\d+)?)[,\s]+([+-]?\d+(?:\.\d+)?)/);
  if (!pairMatch) {
    return null;
  }

  return parseCoordinatePair(pairMatch[1], pairMatch[2]);
}

const DECIMAL_KEY_PAIRS: Array<[string, string]> = [
  ["latitude", "longitude"],
  ["Latitude", "Longitude"],
  ["lat", "lng"],
  ["Lat", "Lon"],
];

const DMS_KEY_GROUPS: Array<[string, string, string, string]> = [
  ["GPSLatitude", "GPSLatitudeRef", "GPSLongitude", "GPSLongitudeRef"],
  ["gpsLatitude", "gpsLatitudeRef", "gpsLongitude", "gpsLongitudeRef"],
];

function parseGpsFromTagRecord(tags: GpsTagRecord): PlaceLocation | null {
  for (const [latKey, lngKey] of DECIMAL_KEY_PAIRS) {
    const parsed = parseCoordinatePair(tags[latKey], tags[lngKey]);
    if (parsed) {
      return parsed;
    }
  }

  for (const [latKey, latRefKey, lngKey, lngRefKey] of DMS_KEY_GROUPS) {
    const lat = dmsToDecimal(tags[latKey], tags[latRefKey]);
    const lng = dmsToDecimal(tags[lngKey], tags[lngRefKey]);
    if (lat === null || lng === null) {
      continue;
    }

    const location = { lat, lng };
    if (isValidPlaceLocation(location)) {
      return location;
    }
  }

  const fromPosition = parseGpsPosition(tags.GPSPosition ?? tags.gpsPosition);
  if (fromPosition) {
    return fromPosition;
  }

  return null;
}

/** Extract GPS coordinates from merged EXIF/XMP metadata tags. */
export function parseGpsFromMetadataTags(
  tags: GpsTagRecord | null | undefined,
): PlaceLocation | null {
  if (!tags) {
    return null;
  }

  const direct = parseGpsFromTagRecord(tags);
  if (direct) {
    return direct;
  }

  if (tags.xmp && typeof tags.xmp === "object" && !Array.isArray(tags.xmp)) {
    return parseGpsFromTagRecord(tags.xmp as GpsTagRecord);
  }

  return null;
}
