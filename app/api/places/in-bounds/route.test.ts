import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/places/in-bounds/route";
import {
  emptyViewport,
  placeA,
  placeB,
  viewportCoveringAOnly,
} from "@/tests/fixtures/places";

const getPlacesInBoundsMock = vi.fn();

vi.mock("@/queries/places", () => ({
  getPlacesInBounds: (...args: unknown[]) => getPlacesInBoundsMock(...args),
}));

function buildRequest(bounds: {
  north: number;
  south: number;
  east: number;
  west: number;
  guideId?: string;
}): Request {
  const params = new URLSearchParams({
    north: String(bounds.north),
    south: String(bounds.south),
    east: String(bounds.east),
    west: String(bounds.west),
  });

  if (bounds.guideId) {
    params.set("guideId", bounds.guideId);
  }

  return new Request(`http://localhost/api/places/in-bounds?${params.toString()}`);
}

describe("GET /api/places/in-bounds", () => {
  beforeEach(() => {
    getPlacesInBoundsMock.mockReset();
  });

  it("on-screen: viewport covering A but not B returns A only", async () => {
    getPlacesInBoundsMock.mockResolvedValue([placeA]);

    const response = await GET(buildRequest(viewportCoveringAOnly));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.places).toHaveLength(1);
    expect(body.places[0].id).toBe(placeA.id);
    expect(body.places.some((place: { id: string }) => place.id === placeB.id)).toBe(
      false,
    );
    expect(getPlacesInBoundsMock).toHaveBeenCalledWith(viewportCoveringAOnly);
  });

  it("empty result: bounds far from all places returns empty array", async () => {
    getPlacesInBoundsMock.mockResolvedValue([]);

    const response = await GET(buildRequest(emptyViewport));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.places).toEqual([]);
  });

  it("returns 400 for invalid bounds", async () => {
    const response = await GET(
      buildRequest({
        north: 40,
        south: 41,
        east: -73,
        west: -74,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBeTruthy();
    expect(getPlacesInBoundsMock).not.toHaveBeenCalled();
  });
});
