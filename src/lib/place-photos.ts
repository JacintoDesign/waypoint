export const PLACE_PHOTOS_BUCKET = "place-photos";

/** Signed URL lifetime in seconds (1 hour). */
export const SIGNED_URL_TTL_SECONDS = 3600;

export function signedUrlExpiresAt(ttlSeconds = SIGNED_URL_TTL_SECONDS): number {
  return Date.now() + ttlSeconds * 1000;
}
