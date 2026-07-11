import { beforeEach, describe, expect, it, vi } from "vitest";

const gpsMock = vi.fn();
const parseMock = vi.fn();

vi.mock("exifr", () => ({
  default: {
    gps: (...args: unknown[]) => gpsMock(...args),
    parse: (...args: unknown[]) => parseMock(...args),
  },
}));

import { extractGpsFromFile } from "@/lib/exif-gps";
import { isValidPlaceLocation } from "@/lib/place-location";

describe("isValidPlaceLocation", () => {
  it("rejects null and undefined", () => {
    expect(isValidPlaceLocation(null)).toBe(false);
    expect(isValidPlaceLocation(undefined)).toBe(false);
  });

  it("rejects NaN coordinates", () => {
    expect(isValidPlaceLocation({ lat: Number.NaN, lng: Number.NaN })).toBe(
      false,
    );
  });

  it("accepts valid coordinates", () => {
    expect(isValidPlaceLocation({ lat: 55.68, lng: 12.59 })).toBe(true);
  });
});

describe("extractGpsFromFile", () => {
  beforeEach(() => {
    gpsMock.mockReset();
    parseMock.mockReset();
  });

  it("returns null when exifr reports NaN coordinates", async () => {
    gpsMock.mockResolvedValue({
      latitude: Number.NaN,
      longitude: Number.NaN,
    });
    parseMock.mockResolvedValue({
      latitude: Number.NaN,
      longitude: Number.NaN,
      GPSLatitude: [Number.NaN, Number.NaN, Number.NaN],
      GPSLongitude: [Number.NaN, Number.NaN, Number.NaN],
    });

    const file = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
    await expect(extractGpsFromFile(file)).resolves.toBeNull();
  });

  it("falls back to metadata tags when exifr.gps returns NaN", async () => {
    gpsMock.mockResolvedValue({
      latitude: Number.NaN,
      longitude: Number.NaN,
    });
    parseMock.mockResolvedValue({
      latitude: Number.NaN,
      longitude: Number.NaN,
      GPSLatitude: [55, 40, 47.52],
      GPSLongitude: [12, 35, 25.2],
    });

    const file = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
    await expect(extractGpsFromFile(file)).resolves.toEqual({
      lat: expect.closeTo(55.679866, 5),
      lng: expect.closeTo(12.590333, 5),
    });
    expect(parseMock).toHaveBeenCalledTimes(1);
  });

  it("reads raw DMS tags when revived metadata is unusable", async () => {
    gpsMock.mockResolvedValue({
      latitude: Number.NaN,
      longitude: Number.NaN,
    });
    parseMock
      .mockResolvedValueOnce({
        latitude: Number.NaN,
        longitude: Number.NaN,
        GPSLatitude: [Number.NaN, Number.NaN, Number.NaN],
        GPSLongitude: [Number.NaN, Number.NaN, Number.NaN],
      })
      .mockResolvedValueOnce({
        GPSLatitude: [55, 40, 47.52],
        GPSLongitude: [12, 35, 25.2],
      });

    const file = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
    await expect(extractGpsFromFile(file)).resolves.toEqual({
      lat: expect.closeTo(55.679866, 5),
      lng: expect.closeTo(12.590333, 5),
    });
    expect(parseMock).toHaveBeenCalledTimes(2);
  });
});
