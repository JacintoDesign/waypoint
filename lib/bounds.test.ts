import { describe, expect, it } from "vitest";
import { parseBoundsSearchParams } from "@/lib/bounds";

describe("parseBoundsSearchParams", () => {
  it("parses valid cardinal bounds", () => {
    const params = new URLSearchParams({
      north: "41.0",
      south: "40.0",
      east: "-73.0",
      west: "-74.0",
    });

    const result = parseBoundsSearchParams(params);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({
        north: 41,
        south: 40,
        east: -73,
        west: -74,
        guideId: undefined,
      });
    }
  });

  it("rejects when north is not greater than south", () => {
    const params = new URLSearchParams({
      north: "40.0",
      south: "41.0",
      east: "-73.0",
      west: "-74.0",
    });

    const result = parseBoundsSearchParams(params);
    expect(result.ok).toBe(false);
  });

  it("rejects when east is not greater than west", () => {
    const params = new URLSearchParams({
      north: "41.0",
      south: "40.0",
      east: "-74.0",
      west: "-73.0",
    });

    const result = parseBoundsSearchParams(params);
    expect(result.ok).toBe(false);
  });
});
