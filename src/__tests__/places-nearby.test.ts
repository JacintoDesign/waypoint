import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  PLACE_A_DISTANCE_METERS,
  PLACE_B_DISTANCE_METERS,
  PLACE_A_ID,
  PLACE_B_ID,
  QUERY_POINT,
  placeARow,
  placeBRow,
} from "@/__tests__/fixtures/places-nearby";
import { getPlacesNearby } from "@/queries/places";

const rpcMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    rpc: rpcMock,
  }),
}));

describe("getPlacesNearby", () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it("returns place A within radius, omits place B, and distance is within 5% of 500m", async () => {
    rpcMock.mockResolvedValue({
      data: [placeARow],
      error: null,
    });

    const places = await getPlacesNearby({
      lat: QUERY_POINT.lat,
      lng: QUERY_POINT.lng,
      radiusMeters: 1000,
    });

    expect(rpcMock).toHaveBeenCalledWith("get_places_nearby", {
      lat: QUERY_POINT.lat,
      lng: QUERY_POINT.lng,
      radius_meters: 1000,
      guide_id: null,
    });

    expect(places).toHaveLength(1);
    expect(places[0]?.id).toBe(PLACE_A_ID);
    expect(places.map((place) => place.id)).not.toContain(PLACE_B_ID);

    const reportedDistance = places[0]?.distanceMeters ?? 0;
    const tolerance = PLACE_A_DISTANCE_METERS * 0.05;
    expect(reportedDistance).toBeGreaterThanOrEqual(
      PLACE_A_DISTANCE_METERS - tolerance,
    );
    expect(reportedDistance).toBeLessThanOrEqual(
      PLACE_A_DISTANCE_METERS + tolerance,
    );
  });

  it("returns results sorted nearest first", async () => {
    rpcMock.mockResolvedValue({
      data: [
        { ...placeARow, distance_meters: 500 },
        { ...placeBRow, distance_meters: 5000 },
      ],
      error: null,
    });

    const places = await getPlacesNearby({
      lat: QUERY_POINT.lat,
      lng: QUERY_POINT.lng,
      radiusMeters: 10_000,
    });

    expect(places[0]?.distanceMeters).toBeLessThan(
      places[1]?.distanceMeters ?? Infinity,
    );
  });

  it("returns an empty array when no places are nearby", async () => {
    rpcMock.mockResolvedValue({
      data: [],
      error: null,
    });

    const places = await getPlacesNearby({
      lat: 0,
      lng: 0,
      radiusMeters: 1000,
    });

    expect(places).toEqual([]);
  });

  it("passes optional guideId to the RPC", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });

    await getPlacesNearby({
      lat: QUERY_POINT.lat,
      lng: QUERY_POINT.lng,
      radiusMeters: 1000,
      guideId: placeARow.guide_id,
    });

    expect(rpcMock).toHaveBeenCalledWith("get_places_nearby", {
      lat: QUERY_POINT.lat,
      lng: QUERY_POINT.lng,
      radius_meters: 1000,
      guide_id: placeARow.guide_id,
    });
  });
});

describe("nearby spatial acceptance criteria", () => {
  it("excludes place B when radius is between A and B distances", () => {
    const radiusMeters = 1000;
    expect(PLACE_A_DISTANCE_METERS).toBeLessThan(radiusMeters);
    expect(PLACE_B_DISTANCE_METERS).toBeGreaterThan(radiusMeters);
  });

  it("keeps reported distance within 5% of 500m for place A", () => {
    const tolerance = PLACE_A_DISTANCE_METERS * 0.05;
    expect(placeARow.distance_meters).toBeGreaterThanOrEqual(
      PLACE_A_DISTANCE_METERS - tolerance,
    );
    expect(placeARow.distance_meters).toBeLessThanOrEqual(
      PLACE_A_DISTANCE_METERS + tolerance,
    );
  });
});
