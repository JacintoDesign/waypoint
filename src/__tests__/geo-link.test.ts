import { describe, expect, it } from "vitest";
import { buildGeoDirectionsHref } from "@/lib/geo-link";

describe("buildGeoDirectionsHref", () => {
  it("builds an RFC 5870 geo URI from coordinates", () => {
    expect(
      buildGeoDirectionsHref({ lat: 55.6799, lng: 12.5908 }),
    ).toBe("geo:55.6799,12.5908");
  });
});
