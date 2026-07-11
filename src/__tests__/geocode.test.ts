import { describe, expect, it, vi } from "vitest";

describe("forwardGeocode", () => {
  it("returns coordinates from a Nominatim response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ lat: "55.68583", lon: "12.57741" }],
    });
    vi.stubGlobal("fetch", fetchMock);

    const { forwardGeocode } = await import("@/lib/geocode");
    await expect(forwardGeocode("Rosenborg Castle, Copenhagen")).resolves.toEqual({
      lat: expect.closeTo(55.68583, 5),
      lng: expect.closeTo(12.57741, 5),
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });

  it("returns null when Nominatim has no matches", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      }),
    );

    const { forwardGeocode } = await import("@/lib/geocode");
    await expect(forwardGeocode("nowhere place xyz")).resolves.toBeNull();

    vi.unstubAllGlobals();
  });
});
