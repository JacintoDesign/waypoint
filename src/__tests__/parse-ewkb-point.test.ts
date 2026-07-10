import { describe, expect, it } from "vitest";
import { parseEwkbPoint } from "@/lib/parse-ewkb-point";

describe("parseEwkbPoint", () => {
  it("decodes a PostGIS EWKB point for Nyhavn", () => {
    const location = parseEwkbPoint(
      "0101000020E61000001FF46C567D2E2940744694F606D74B40",
    );

    expect(location.lng).toBeCloseTo(12.5908, 4);
    expect(location.lat).toBeCloseTo(55.6799, 4);
  });
});
