export const PLACE_PHOTOS_BUCKET = "place-photos";

/** Signed URL lifetime in seconds (1 hour). */
export const SIGNED_URL_TTL_SECONDS = 3600;

/** Maximum size for a single uploaded image (10 MiB). */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Maximum total photo data per guide update (50 MiB, Supabase free tier). */
export const MAX_UPLOAD_BATCH_BYTES = 50 * 1024 * 1024;

/** Maximum Server Action request body size for photo uploads (50 MiB). */
export const SERVER_ACTION_BODY_SIZE_LIMIT = "50mb";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function maxImageSizeLabel(): string {
  return `${MAX_IMAGE_BYTES / (1024 * 1024)} MB`;
}

export function maxUploadBatchSizeLabel(): string {
  return `${MAX_UPLOAD_BATCH_BYTES / (1024 * 1024)} MB`;
}

export function guidePhotoUploadLimitMessage(): string {
  return `Each photo can be up to ${maxImageSizeLabel()}. Each update to your guide can include at most ${maxUploadBatchSizeLabel()} of photos total — a hard limit on the Supabase free plan.`;
}

export function validatePhotoUploadBatch(files: File[]): string | null {
  if (files.length === 0) {
    return null;
  }

  let totalBytes = 0;

  for (const file of files) {
    const singleFileError = validateImageFile(file, "Photo");
    if (singleFileError) {
      return singleFileError;
    }

    totalBytes += file.size;
  }

  if (totalBytes > MAX_UPLOAD_BATCH_BYTES) {
    return `Each update can include at most ${maxUploadBatchSizeLabel()} of photos total (Supabase free tier limit).`;
  }

  return null;
}

export function validateImageFile(
  file: File,
  label: "Cover photo" | "Photo",
): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return `${label} must be a JPEG, PNG, or WebP image.`;
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return `${label} must be ${maxImageSizeLabel()} or smaller.`;
  }

  return null;
}

export function signedUrlExpiresAt(ttlSeconds = SIGNED_URL_TTL_SECONDS): number {
  return Date.now() + ttlSeconds * 1000;
}
