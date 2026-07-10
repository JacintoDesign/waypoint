import { describe, expect, it } from "vitest";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  getMapViewportFromPlaces,
  SINGLE_PLACE_ZOOM,
} from "@/lib/map-viewport";
import { placeA, placeB } from "@/__tests__/fixtures/places";

describe("getMapViewportFromPlaces", () => {
  it("returns a world default when there are no places", () => {
    expect(getMapViewportFromPlaces([])).toEqual({
      kind: "center",
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
    });
  });

  it("centers on a single place at street zoom", () => {
    expect(getMapViewportFromPlaces([placeA])).toEqual({
      kind: "center",
      center: [placeA.location.lng, placeA.location.lat],
      zoom: SINGLE_PLACE_ZOOM,
    });
  });

  it("fits bounds when multiple places are present", () => {
    const viewport = getMapViewportFromPlaces([placeA, placeB]);

    expect(viewport).toEqual({
      kind: "bounds",
      bounds: [
        [placeB.location.lng, placeB.location.lat],
        [placeA.location.lng, placeA.location.lat],
      ],
    });
  });
});
