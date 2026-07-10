import type { PlaceLocation } from "@/types/place";

/** Decode a little-endian EWKB Point with SRID 4326 from PostgREST. */
export function parseEwkbPoint(hex: string): PlaceLocation {
  const buffer = Buffer.from(hex, "hex");

  return {
    lng: buffer.readDoubleLE(9),
    lat: buffer.readDoubleLE(17),
  };
}
