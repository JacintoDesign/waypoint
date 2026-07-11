import { describe, expect, it } from "vitest";
import { dmsToDecimal, parseGpsFromMetadataTags } from "@/lib/parse-gps-coords";

describe("dmsToDecimal", () => {
  it("converts DMS arrays with reference directions", () => {
    expect(dmsToDecimal([55, 40, 47.52], "N")).toBeCloseTo(55.679866, 5);
    expect(dmsToDecimal([12, 35, 25.2], "E")).toBeCloseTo(12.590333, 5);
    expect(dmsToDecimal([33, 52, 0], "S")).toBeCloseTo(-33.866667, 5);
    expect(dmsToDecimal([151, 12, 0], "E")).toBeCloseTo(151.2, 5);
  });

  it("converts EXIF rational tuples", () => {
    expect(dmsToDecimal([[55, 1], [40, 1], [4752, 100]], "N")).toBeCloseTo(
      55.679866,
      5,
    );
    expect(dmsToDecimal([[12, 1], [35, 1], [252, 10]], "E")).toBeCloseTo(
      12.590333,
      5,
    );
  });

  it("accepts decimal values with hemisphere refs", () => {
    expect(dmsToDecimal(55.6799, "N")).toBeCloseTo(55.6799, 4);
    expect(dmsToDecimal(12.5908, "W")).toBeCloseTo(-12.5908, 4);
  });

  it("defaults to positive hemisphere when refs are missing", () => {
    expect(dmsToDecimal([55, 40, 47.52], undefined)).toBeCloseTo(55.679866, 5);
    expect(dmsToDecimal(55.6799, undefined)).toBeCloseTo(55.6799, 4);
  });

  it("rejects invalid values", () => {
    expect(dmsToDecimal([Number.NaN, Number.NaN, Number.NaN], "N")).toBeNull();
    expect(dmsToDecimal([null, null, null], "N")).toBeNull();
  });
});

describe("parseGpsFromMetadataTags", () => {
  it("reads revived decimal coordinates", () => {
    expect(
      parseGpsFromMetadataTags({ latitude: 55.6799, longitude: 12.5908 }),
    ).toEqual({ lat: 55.6799, lng: 12.5908 });
  });

  it("reads alternate lat/lng keys", () => {
    expect(parseGpsFromMetadataTags({ lat: 40.75, lng: -73.98 })).toEqual({
      lat: 40.75,
      lng: -73.98,
    });
  });

  it("reads EXIF DMS tags when refs are missing", () => {
    expect(
      parseGpsFromMetadataTags({
        GPSLatitude: [55, 40, 47.52],
        GPSLongitude: [12, 35, 25.2],
      }),
    ).toEqual({
      lat: expect.closeTo(55.679866, 5),
      lng: expect.closeTo(12.590333, 5),
    });
  });

  it("reads GPSPosition decimal pairs", () => {
    expect(
      parseGpsFromMetadataTags({ GPSPosition: "55.6799, 12.5908" }),
    ).toEqual({ lat: 55.6799, lng: 12.5908 });
  });

  it("reads nested XMP metadata", () => {
    expect(
      parseGpsFromMetadataTags({
        xmp: {
          GPSLatitude: [55, 40, 47.52],
          GPSLatitudeRef: "N",
          GPSLongitude: [12, 35, 25.2],
          GPSLongitudeRef: "E",
        },
      }),
    ).toEqual({
      lat: expect.closeTo(55.679866, 5),
      lng: expect.closeTo(12.590333, 5),
    });
  });

  it("rejects NaN coordinates", () => {
    expect(
      parseGpsFromMetadataTags({
        latitude: Number.NaN,
        longitude: Number.NaN,
      }),
    ).toBeNull();
  });
});
