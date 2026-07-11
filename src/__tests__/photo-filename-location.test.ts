import { describe, expect, it } from "vitest";
import { buildGeocodeQueryFromFilename } from "@/lib/photo-filename-location";

describe("buildGeocodeQueryFromFilename", () => {
  it("maps comma-separated city codes", () => {
    expect(buildGeocodeQueryFromFilename("nyhavn, CPH.jpg")).toBe(
      "nyhavn, Copenhagen",
    );
    expect(buildGeocodeQueryFromFilename("round tower, CPH.jpg")).toBe(
      "round tower, Copenhagen",
    );
  });

  it("maps double-underscore city suffixes", () => {
    expect(buildGeocodeQueryFromFilename("rosenborg_castle__CPH.png")).toBe(
      "rosenborg castle, Copenhagen",
    );
  });

  it("maps single city suffixes", () => {
    expect(buildGeocodeQueryFromFilename("designmuseum_CPH.jpg")).toBe(
      "designmuseum, Copenhagen",
    );
  });

  it("humanizes plain landmark names", () => {
    expect(buildGeocodeQueryFromFilename("tivoli_gardens.jpg")).toBe(
      "tivoli gardens",
    );
  });

  it("rejects generic camera filenames", () => {
    expect(buildGeocodeQueryFromFilename("IMG_1234.jpg")).toBeNull();
    expect(buildGeocodeQueryFromFilename("20240711_143052.jpg")).toBeNull();
  });
});
