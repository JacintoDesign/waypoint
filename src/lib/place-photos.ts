export const PLACE_PHOTOS_BUCKET = "place-photos";

/** Signed URL lifetime in seconds (1 hour). */
export const SIGNED_URL_TTL_SECONDS = 3600;

/** Resize options passed to Supabase Storage signed URL transforms. */
export type SignedUrlTransform = {
  width: number;
  height?: number;
  resize?: "cover" | "contain" | "fill";
};

/** Place card galleries display at ~600px; serve 2× for retina without full originals. */
export const PLACE_CARD_PHOTO_TRANSFORM: SignedUrlTransform = {
  width: 1200,
  resize: "contain",
};

/** Hero cover images on guide pages. */
export const GUIDE_COVER_PHOTO_TRANSFORM: SignedUrlTransform = {
  width: 1600,
  resize: "contain",
};

/** Cover thumbnails on the guide list grid. */
export const GUIDE_LIST_COVER_TRANSFORM: SignedUrlTransform = {
  width: 800,
  height: 600,
  resize: "cover",
};

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
  "image/heic",
  "image/heif",
]);

const ALLOWED_IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
  ".heif",
]);

/**
 * Android Chrome's image-only picker strips GPS EXIF for privacy. Including a
 * non-image MIME type nudges the system file picker, which preserves location.
 */
export const PHOTO_FILE_INPUT_ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,text/plain,application/octet-stream";

function extensionForFileName(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
}

export function photoFileExtension(file: File): string {
  switch (file.type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/heic":
    case "image/heif":
      return "heic";
    default:
      break;
  }

  const fromName = extensionForFileName(file.name);
  if (fromName === ".png") return "png";
  if (fromName === ".webp") return "webp";
  if (fromName === ".heic" || fromName === ".heif") return "heic";
  return "jpg";
}

export function photoFileContentType(file: File): string {
  if (file.type && ALLOWED_IMAGE_TYPES.has(file.type)) {
    return file.type === "image/heif" ? "image/heic" : file.type;
  }

  switch (photoFileExtension(file)) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "heic":
      return "image/heic";
    default:
      return "image/jpeg";
  }
}

export function isAllowedPhotoFile(file: File): boolean {
  if (ALLOWED_IMAGE_TYPES.has(file.type)) {
    return true;
  }

  return ALLOWED_IMAGE_EXTENSIONS.has(extensionForFileName(file.name));
}

export function allowedPhotoFormatsLabel(): string {
  return "JPEG, PNG, WebP, or HEIC";
}

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
  if (!isAllowedPhotoFile(file)) {
    return `${label} must be a ${allowedPhotoFormatsLabel()} image.`;
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return `${label} must be ${maxImageSizeLabel()} or smaller.`;
  }

  return null;
}

export function signedUrlExpiresAt(ttlSeconds = SIGNED_URL_TTL_SECONDS): number {
  return Date.now() + ttlSeconds * 1000;
}
