"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  cacheImageBlob,
  getCachedBlobUrl,
  isImageCached,
  photoCacheKey,
} from "@/lib/image-cache";
import type { SignedPhotoResponse } from "@/types/photo";
import styles from "./signed-photo.module.css";

const REFRESH_BUFFER_MS = 60_000;

export type SignedPhotoProps = {
  photoId: string;
  src: string;
  expiresAt: number;
  alt: string;
  className?: string;
  /** Use "full" for editor previews; default "display" serves a resized transform. */
  variant?: "display" | "full";
};

export function SignedPhoto({
  photoId,
  src,
  expiresAt,
  alt,
  className,
  variant = "display",
}: SignedPhotoProps) {
  const cacheKey = photoCacheKey(photoId, variant);
  const signedSrcRef = useRef(src);
  const refreshingRef = useRef(false);
  const [displaySrc, setDisplaySrc] = useState(
    () => getCachedBlobUrl(cacheKey) ?? src,
  );
  const [currentExpiresAt, setCurrentExpiresAt] = useState(expiresAt);

  useEffect(() => {
    signedSrcRef.current = src;
    setCurrentExpiresAt(expiresAt);

    const cached = getCachedBlobUrl(cacheKey);
    if (cached) {
      setDisplaySrc(cached);
      return;
    }

    setDisplaySrc(src);
  }, [cacheKey, expiresAt, src]);

  const refresh = useCallback(async () => {
    if (refreshingRef.current) {
      return;
    }

    refreshingRef.current = true;

    try {
      const response = await fetch(
        `/api/photos/${photoId}/signed-url?variant=${variant}`,
      );
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as SignedPhotoResponse;
      signedSrcRef.current = data.url;
      setCurrentExpiresAt(data.expiresAt);

      if (!isImageCached(cacheKey)) {
        setDisplaySrc(data.url);
      }
    } finally {
      refreshingRef.current = false;
    }
  }, [cacheKey, photoId, variant]);

  useEffect(() => {
    const msUntilRefresh = currentExpiresAt - Date.now() - REFRESH_BUFFER_MS;
    if (msUntilRefresh <= 0) {
      void refresh();
      return;
    }

    const timer = window.setTimeout(() => {
      void refresh();
    }, msUntilRefresh);

    return () => {
      window.clearTimeout(timer);
    };
  }, [currentExpiresAt, refresh]);

  const handleError = useCallback(() => {
    void refresh();
  }, [refresh]);

  const handleLoad = useCallback(() => {
    if (!isImageCached(cacheKey)) {
      void cacheImageBlob(cacheKey, signedSrcRef.current);
    }
  }, [cacheKey]);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- signed URLs are ephemeral
    <img
      src={displaySrc}
      alt={alt}
      className={className ? `${styles.photo} ${className}` : styles.photo}
      decoding="async"
      onLoad={handleLoad}
      onError={handleError}
    />
  );
}
