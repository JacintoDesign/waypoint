"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const [currentSrc, setCurrentSrc] = useState(src);
  const [currentExpiresAt, setCurrentExpiresAt] = useState(expiresAt);
  const refreshingRef = useRef(false);

  useEffect(() => {
    setCurrentSrc(src);
    setCurrentExpiresAt(expiresAt);
  }, [src, expiresAt]);

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
      setCurrentSrc(data.url);
      setCurrentExpiresAt(data.expiresAt);
    } finally {
      refreshingRef.current = false;
    }
  }, [photoId, variant]);

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

  return (
    // eslint-disable-next-line @next/next/no-img-element -- signed URLs are ephemeral
    <img
      src={currentSrc}
      alt={alt}
      className={className ? `${styles.photo} ${className}` : styles.photo}
      onError={handleError}
    />
  );
}
