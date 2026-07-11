import { describe, expect, it } from "vitest";
import {
  isAllowedPhotoFile,
  PHOTO_FILE_INPUT_ACCEPT,
  photoFileContentType,
  validateImageFile,
} from "@/lib/place-photos";

describe("photo file input", () => {
  it("includes a non-image MIME type for Android GPS preservation", () => {
    expect(PHOTO_FILE_INPUT_ACCEPT).toContain("text/plain");
    expect(PHOTO_FILE_INPUT_ACCEPT).toContain("image/heic");
  });

  it("accepts HEIC files by extension when MIME is missing", () => {
    const file = new File(["photo"], "rosenborg.heic", { type: "" });
    expect(isAllowedPhotoFile(file)).toBe(true);
    expect(validateImageFile(file, "Photo")).toBeNull();
    expect(photoFileContentType(file)).toBe("image/heic");
  });

  it("rejects unsupported files", () => {
    const file = new File(["notes"], "notes.txt", { type: "text/plain" });
    expect(isAllowedPhotoFile(file)).toBe(false);
  });
});
