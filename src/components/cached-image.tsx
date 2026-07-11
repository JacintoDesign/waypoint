"use client";

import { useEffect, useState } from "react";
import {
  cacheImageBlob,
  getCachedBlobUrl,
  isImageCached,
} from "@/lib/image-cache";

export type CachedImageProps = {
  cacheKey: string;
  src: string;
  alt: string;
  className?: string;
  readyClassName?: string;
  onError?: () => void;
};

export function CachedImage({
  cacheKey,
  src,
  alt,
  className,
  readyClassName,
  onError,
}: CachedImageProps) {
  const [displaySrc, setDisplaySrc] = useState(
    () => getCachedBlobUrl(cacheKey) ?? src,
  );
  const [ready, setReady] = useState(() => isImageCached(cacheKey));

  useEffect(() => {
    const cached = getCachedBlobUrl(cacheKey);
    if (cached) {
      setDisplaySrc(cached);
      setReady(true);
      return;
    }

    setDisplaySrc(src);
    setReady(false);
  }, [cacheKey, src]);

  const handleLoad = () => {
    setReady(true);

    if (!isImageCached(cacheKey)) {
      void cacheImageBlob(cacheKey, src);
    }
  };

  const classes = [
    className,
    ready && readyClassName ? readyClassName : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    // eslint-disable-next-line @next/next/no-img-element -- blob URLs and signed URLs are client-managed
    <img
      src={displaySrc}
      alt={alt}
      className={classes || undefined}
      decoding="async"
      onLoad={handleLoad}
      onError={onError}
    />
  );
}
