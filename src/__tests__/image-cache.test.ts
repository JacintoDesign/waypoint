import { describe, expect, it } from "vitest";
import {
  coverHeroCacheKey,
  coverListCacheKey,
  photoCacheKey,
} from "@/lib/image-cache";

describe("image cache keys", () => {
  it("builds stable cover list keys from storage paths", () => {
    expect(coverListCacheKey("guide-1/cover/abc.jpg")).toBe(
      "cover:list:guide-1/cover/abc.jpg",
    );
  });

  it("builds stable cover hero keys from storage paths", () => {
    expect(coverHeroCacheKey("guide-1/cover/abc.jpg")).toBe(
      "cover:hero:guide-1/cover/abc.jpg",
    );
  });

  it("builds stable photo keys from ids and variants", () => {
    expect(photoCacheKey("photo-1", "display")).toBe("photo:photo-1:display");
    expect(photoCacheKey("photo-1", "full")).toBe("photo:photo-1:full");
  });
});
