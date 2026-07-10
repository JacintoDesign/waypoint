import type { NearbyPlacesRow } from "@/types/place";

export const PLACE_A_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
export const PLACE_B_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
export const GUIDE_ID = "cccccccc-cccc-cccc-cccc-cccccccccccc";

/** Query point used in TEST_PLAN: 500m from A, 5km from B */
export const QUERY_POINT = {
  lat: 40.748817,
  lng: -73.985428,
} as const;

export const PLACE_A_DISTANCE_METERS = 500;
export const PLACE_B_DISTANCE_METERS = 5000;

export const placeARow: NearbyPlacesRow = {
  id: PLACE_A_ID,
  guide_id: GUIDE_ID,
  name: "Place A",
  address: "Near query point",
  notes: null,
  rating: 4,
  category: "cafe",
  sort_order: 0,
  lat: 40.75331,
  lng: -73.985428,
  distance_meters: PLACE_A_DISTANCE_METERS,
};

export const placeBRow: NearbyPlacesRow = {
  id: PLACE_B_ID,
  guide_id: GUIDE_ID,
  name: "Place B",
  address: "Far from query point",
  notes: null,
  rating: 5,
  category: "restaurant",
  sort_order: 1,
  lat: 40.793817,
  lng: -73.985428,
  distance_meters: PLACE_B_DISTANCE_METERS,
};
