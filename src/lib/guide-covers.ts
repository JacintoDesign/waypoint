import {
  PLACE_PHOTOS_BUCKET,
  validateImageFile,
} from "@/lib/place-photos";
import { signPhotoStoragePaths } from "@/queries/photos";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export function isExternalCoverUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function extensionForMime(type: string): string {
  switch (type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

export function validateCoverImageFile(file: File): string | null {
  return validateImageFile(file, "Cover photo");
}

export async function uploadGuideCoverPhoto(
  guideId: string,
  file: File,
): Promise<string> {
  const validationError = validateCoverImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const supabase = createSupabaseServiceClient();
  const extension = extensionForMime(file.type);
  const storagePath = `${guideId}/cover/${crypto.randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(PLACE_PHOTOS_BUCKET)
    .upload(storagePath, bytes, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return storagePath;
}

export async function resolveCoverPhotoSrc(
  coverPhotoUrl: string | null,
): Promise<string | null> {
  if (!coverPhotoUrl) {
    return null;
  }

  if (isExternalCoverUrl(coverPhotoUrl)) {
    return coverPhotoUrl;
  }

  const signed = await signPhotoStoragePaths([coverPhotoUrl]);
  return signed.get(coverPhotoUrl) ?? null;
}

export async function resolveCoverPhotoSrcs(
  coverPhotoUrls: (string | null)[],
): Promise<Map<string, string>> {
  const storagePaths = coverPhotoUrls.filter(
    (url): url is string =>
      typeof url === "string" && url.length > 0 && !isExternalCoverUrl(url),
  );
  const signed = await signPhotoStoragePaths(storagePaths);
  const result = new Map<string, string>();

  for (const url of coverPhotoUrls) {
    if (!url) {
      continue;
    }

    if (isExternalCoverUrl(url)) {
      result.set(url, url);
      continue;
    }

    const signedUrl = signed.get(url);
    if (signedUrl) {
      result.set(url, signedUrl);
    }
  }

  return result;
}
