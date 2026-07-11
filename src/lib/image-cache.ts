const blobUrls = new Map<string, string>();
const loadPromises = new Map<string, Promise<string>>();

export function coverListCacheKey(coverPhotoUrl: string): string {
  return `cover:list:${coverPhotoUrl}`;
}

export function coverHeroCacheKey(coverPhotoUrl: string): string {
  return `cover:hero:${coverPhotoUrl}`;
}

export function photoCacheKey(
  photoId: string,
  variant: "display" | "full",
): string {
  return `photo:${photoId}:${variant}`;
}

export function getCachedBlobUrl(cacheKey: string): string | undefined {
  return blobUrls.get(cacheKey);
}

export function isImageCached(cacheKey: string): boolean {
  return blobUrls.has(cacheKey);
}

function storeBlob(cacheKey: string, blob: Blob): string {
  const existing = blobUrls.get(cacheKey);
  if (existing) {
    URL.revokeObjectURL(existing);
  }

  const url = URL.createObjectURL(blob);
  blobUrls.set(cacheKey, url);
  return url;
}

async function fetchAndStore(cacheKey: string, src: string): Promise<string> {
  const response = await fetch(src);
  if (!response.ok) {
    throw new Error(`Failed to cache image (${response.status})`);
  }

  const blob = await response.blob();
  return storeBlob(cacheKey, blob);
}

export function cacheImageBlob(cacheKey: string, src: string): Promise<string> {
  const cached = blobUrls.get(cacheKey);
  if (cached) {
    return Promise.resolve(cached);
  }

  const pending = loadPromises.get(cacheKey);
  if (pending) {
    return pending;
  }

  const promise = fetchAndStore(cacheKey, src)
    .catch(() => src)
    .finally(() => {
      loadPromises.delete(cacheKey);
    });

  loadPromises.set(cacheKey, promise);
  return promise;
}

export function preloadCachedImage(cacheKey: string, src: string): void {
  if (!isImageCached(cacheKey)) {
    void cacheImageBlob(cacheKey, src);
  }
}

export function preloadCachedImages(
  entries: { cacheKey: string; src: string }[],
): void {
  for (const entry of entries) {
    preloadCachedImage(entry.cacheKey, entry.src);
  }
}
