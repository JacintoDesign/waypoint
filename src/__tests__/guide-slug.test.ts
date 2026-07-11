import { describe, expect, it } from "vitest";
import {
  isValidGuideSlug,
  normalizeGuideSlug,
  resolveUniqueGuideSlug,
  slugifyGuideTitle,
} from "@/lib/guide-slug";

describe("slugifyGuideTitle", () => {
  it("lowercases and hyphenates non-alphanumeric runs", () => {
    expect(slugifyGuideTitle("Best Coffee in NYC!")).toBe("best-coffee-in-nyc");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugifyGuideTitle("---Hello---")).toBe("hello");
  });

  it("falls back to guide when title has no slug characters", () => {
    expect(slugifyGuideTitle("   ")).toBe("guide");
    expect(slugifyGuideTitle("!!!")).toBe("guide");
  });
});

describe("normalizeGuideSlug", () => {
  it("normalizes manual slug input the same way as titles", () => {
    expect(normalizeGuideSlug("My Custom Slug")).toBe("my-custom-slug");
  });
});

describe("isValidGuideSlug", () => {
  it("accepts URL-safe slugs", () => {
    expect(isValidGuideSlug("best-coffee-in-nyc")).toBe(true);
    expect(isValidGuideSlug("guide-2")).toBe(true);
  });

  it("rejects invalid slug shapes", () => {
    expect(isValidGuideSlug("")).toBe(false);
    expect(isValidGuideSlug("-leading")).toBe(false);
    expect(isValidGuideSlug("trailing-")).toBe(false);
    expect(isValidGuideSlug("has space")).toBe(false);
    expect(isValidGuideSlug("UPPER")).toBe(false);
  });
});

describe("resolveUniqueGuideSlug", () => {
  it("appends numeric suffixes until the slug is unused", () => {
    const taken = new Set(["paris", "paris-1"]);

    expect(resolveUniqueGuideSlug("paris", taken)).toBe("paris-2");
  });
});
