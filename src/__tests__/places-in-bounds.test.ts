import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPlacesInBounds } from "@/queries/places";
import {
  emptyViewport,
  placeA,
  viewportCoveringAOnly,
} from "@/__tests__/fixtures/places";

const rpcMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => ({
    rpc: rpcMock,
  }),
}));

describe("getPlacesInBounds", () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it("calls get_places_in_bounds RPC with cardinal bounds", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          id: placeA.id,
          guide_id: placeA.guideId,
          name: placeA.name,
          address: placeA.address,
          notes: placeA.notes,
          rating: placeA.rating,
          category: placeA.category,
          sort_order: placeA.sortOrder,
          latitude: placeA.location.lat,
          longitude: placeA.location.lng,
        },
      ],
      error: null,
    });

    const result = await getPlacesInBounds(viewportCoveringAOnly);

    expect(rpcMock).toHaveBeenCalledWith("get_places_in_bounds", {
      p_north: viewportCoveringAOnly.north,
      p_south: viewportCoveringAOnly.south,
      p_east: viewportCoveringAOnly.east,
      p_west: viewportCoveringAOnly.west,
      p_guide_id: null,
    });
    expect(result).toEqual([placeA]);
    expect(result[0]).not.toHaveProperty("distanceMeters");
  });

  it("returns empty array when RPC returns no rows", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });

    const result = await getPlacesInBounds(emptyViewport);

    expect(result).toEqual([]);
  });

  it("throws when RPC fails", async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: "function not found" },
    });

    await expect(getPlacesInBounds(emptyViewport)).rejects.toEqual({
      message: "function not found",
    });
  });
});
