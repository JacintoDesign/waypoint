import { describe, expect, it } from "vitest";
import { toGeographyPoint } from "@/lib/geography";

describe("toGeographyPoint", () => {
  it("formats WKT for geography(Point, 4326) with lng before lat", () => {
    expect(toGeographyPoint({ lng: -73.98, lat: 40.75 })).toBe(
      "SRID=4326;POINT(-73.98 40.75)",
    );
  });
});
