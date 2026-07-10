import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/places/nearby/route";
import {
  PLACE_A_ID,
  QUERY_POINT,
  placeARow,
} from "@/__tests__/fixtures/places-nearby";

const getPlacesNearbyMock = vi.fn();

vi.mock("@/queries/places", () => ({
  getPlacesNearby: (...args: unknown[]) => getPlacesNearbyMock(...args),
}));

describe("GET /api/places/nearby", () => {
  beforeEach(() => {
    getPlacesNearbyMock.mockReset();
  });

  it("returns nearby places as JSON", async () => {
    getPlacesNearbyMock.mockResolvedValue([
      {
        id: placeARow.id,
        guideId: placeARow.guide_id,
        name: placeARow.name,
        address: placeARow.address,
        notes: placeARow.notes,
        rating: placeARow.rating,
        category: placeARow.category,
        sortOrder: placeARow.sort_order,
        location: { lat: placeARow.lat, lng: placeARow.lng },
        distanceMeters: placeARow.distance_meters,
      },
    ]);

    const response = await GET(
      new Request(
        `http://localhost/api/places/nearby?lat=${QUERY_POINT.lat}&lng=${QUERY_POINT.lng}&radius=1000`,
      ),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.places).toHaveLength(1);
    expect(body.places[0].id).toBe(PLACE_A_ID);
    expect(body.places[0].distanceMeters).toBe(500);
  });

  it("returns an empty array for queries far from all places", async () => {
    getPlacesNearbyMock.mockResolvedValue([]);

    const response = await GET(
      new Request(
        "http://localhost/api/places/nearby?lat=0&lng=0&radius=1000",
      ),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.places).toEqual([]);
  });

  it("returns 400 for invalid query parameters", async () => {
    const response = await GET(
      new Request("http://localhost/api/places/nearby?lat=invalid&lng=0&radius=1000"),
    );

    expect(response.status).toBe(400);
    expect(getPlacesNearbyMock).not.toHaveBeenCalled();
  });
});
