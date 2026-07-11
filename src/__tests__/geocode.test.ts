import { describe, expect, it, vi } from "vitest";
import { formatNominatimAddress } from "@/lib/geocode";

describe("formatNominatimAddress", () => {
  it("formats street and locality like place cards", () => {
    expect(
      formatNominatimAddress({
        road: "Vandkunsten",
        house_number: "5",
        postcode: "1467",
        city: "København",
      }),
    ).toBe("Vandkunsten 5, 1467 København");
  });

  it("returns locality when no street is available", () => {
    expect(
      formatNominatimAddress({
        postcode: "2100",
        city: "Copenhagen",
      }),
    ).toBe("2100 Copenhagen");
  });
});

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

describe("reverseGeocode", () => {
  it("returns a display address from a Nominatim reverse response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        address: {
          road: "Øster Voldgade",
          house_number: "4A",
          postcode: "1350",
          city: "København",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { reverseGeocode } = await import("@/lib/geocode");
    await expect(
      reverseGeocode({ lat: 55.6867, lng: 12.5761 }),
    ).resolves.toBe("Øster Voldgade 4A, 1350 København");

    expect(fetchMock).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });

  it("returns null when Nominatim has no address details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      }),
    );

    const { reverseGeocode } = await import("@/lib/geocode");
    await expect(
      reverseGeocode({ lat: 55.6867, lng: 12.5761 }),
    ).resolves.toBeNull();

    vi.unstubAllGlobals();
  });
});
