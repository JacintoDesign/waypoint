import { isValidPlaceLocation } from "@/lib/place-location";
import type { PlaceLocation } from "@/types/place";

const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";
const NOMINATIM_USER_AGENT = "Waypoint/0.1 (travel guide editor)";
const MIN_REQUEST_INTERVAL_MS = 1_100;

let lastRequestAt = 0;

type NominatimResult = {
  lat?: string;
  lon?: string;
};

type NominatimAddress = {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  footway?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  postcode?: string;
};

type NominatimReverseResult = {
  address?: NominatimAddress;
};

async function throttleGeocodeRequests(): Promise<void> {
  const now = Date.now();
  const waitMs = MIN_REQUEST_INTERVAL_MS - (now - lastRequestAt);
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  lastRequestAt = Date.now();
}

function parseNominatimResult(result: NominatimResult): PlaceLocation | null {
  if (typeof result.lat !== "string" || typeof result.lon !== "string") {
    return null;
  }

  const location: PlaceLocation = {
    lat: Number(result.lat),
    lng: Number(result.lon),
  };

  return isValidPlaceLocation(location) ? location : null;
}

/** Forward-geocode a place name to coordinates via OpenStreetMap Nominatim. */
export async function forwardGeocode(query: string): Promise<PlaceLocation | null> {
  const trimmed = query.trim();
  if (trimmed.length < 3) {
    return null;
  }

  await throttleGeocodeRequests();

  const url = new URL(NOMINATIM_SEARCH_URL);
  url.searchParams.set("q", trimmed);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "0");

  const response = await fetch(url, {
    headers: {
      "User-Agent": NOMINATIM_USER_AGENT,
      Accept: "application/json",
    },
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!response.ok) {
    return null;
  }

  const results = (await response.json()) as NominatimResult[];
  if (!Array.isArray(results) || results.length === 0) {
    return null;
  }

  return parseNominatimResult(results[0]);
}

/** Build a short display address from Nominatim structured address fields. */
export function formatNominatimAddress(address: NominatimAddress): string | null {
  const street = address.road ?? address.pedestrian ?? address.footway;
  const streetLine = street
    ? [street, address.house_number].filter(Boolean).join(" ")
    : null;
  const locality =
    address.city ?? address.town ?? address.village ?? address.municipality;
  const localityLine = [address.postcode, locality].filter(Boolean).join(" ");

  const parts = [streetLine, localityLine].filter(
    (part): part is string => Boolean(part),
  );

  return parts.length > 0 ? parts.join(", ") : null;
}

/** Reverse-geocode coordinates to a display address via OpenStreetMap Nominatim. */
export async function reverseGeocode(
  location: PlaceLocation,
): Promise<string | null> {
  if (!isValidPlaceLocation(location)) {
    return null;
  }

  await throttleGeocodeRequests();

  const url = new URL(NOMINATIM_REVERSE_URL);
  url.searchParams.set("lat", String(location.lat));
  url.searchParams.set("lon", String(location.lng));
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("zoom", "18");

  const response = await fetch(url, {
    headers: {
      "User-Agent": NOMINATIM_USER_AGENT,
      Accept: "application/json",
    },
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!response.ok) {
    return null;
  }

  const result = (await response.json()) as NominatimReverseResult;
  if (!result.address) {
    return null;
  }

  return formatNominatimAddress(result.address);
}
