/** Fixture coordinates for on-screen acceptance tests (TEST_PLAN.md). */
export const placeA = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  guideId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  name: "Place A",
  address: "123 Main St",
  notes: null,
  rating: 4,
  category: "cafe",
  sortOrder: 0,
  location: { latitude: 40.75, longitude: -73.98 },
} as const;

export const placeB = {
  id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
  guideId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  name: "Place B",
  address: "456 Oak Ave",
  notes: null,
  rating: 5,
  category: "restaurant",
  sortOrder: 1,
  location: { latitude: 34.05, longitude: -118.25 },
} as const;

/** Viewport covering Place A (NYC) but not Place B (LA). */
export const viewportCoveringAOnly = {
  north: 41.0,
  south: 40.0,
  east: -73.0,
  west: -74.5,
} as const;

/** Viewport in the Pacific Ocean, far from all fixture places. */
export const emptyViewport = {
  north: 0.5,
  south: -0.5,
  east: -160.0,
  west: -161.0,
} as const;
