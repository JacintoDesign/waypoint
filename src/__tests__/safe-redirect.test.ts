import { describe, expect, it } from "vitest";
import { getSafeRedirectPath } from "@/lib/safe-redirect";

describe("getSafeRedirectPath", () => {
  it("returns the path when it is a safe relative URL", () => {
    expect(getSafeRedirectPath("/guides/new")).toBe("/guides/new");
    expect(getSafeRedirectPath("/guides/abc?tab=places")).toBe(
      "/guides/abc?tab=places",
    );
  });

  it("falls back for missing or unsafe values", () => {
    expect(getSafeRedirectPath(null)).toBe("/guides");
    expect(getSafeRedirectPath("https://evil.com")).toBe("/guides");
    expect(getSafeRedirectPath("//evil.com")).toBe("/guides");
    expect(getSafeRedirectPath("/\\evil.com")).toBe("/guides");
    expect(getSafeRedirectPath("javascript:alert(1)")).toBe("/guides");
  });
});
