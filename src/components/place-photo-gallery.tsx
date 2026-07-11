"use client";

import { useCallback, useEffect, useState, type FocusEvent } from "react";
import { SignedPhoto } from "@/components/signed-photo";
import type { SignedPlacePhoto } from "@/types/photo";
import styles from "./place-photo-gallery.module.css";

const AUTO_ADVANCE_MS = 3_000;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export type PlacePhotoGalleryProps = {
  photos: SignedPlacePhoto[];
  placeName: string;
};

export function PlacePhotoGallery({ photos, placeName }: PlacePhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const photoCount = photos.length;
  const hasMultiple = photoCount > 1;
  const activePhoto = photos[activeIndex];

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(((index % photoCount) + photoCount) % photoCount);
    },
    [photoCount],
  );

  const goNext = useCallback(() => {
    goTo(activeIndex + 1);
  }, [activeIndex, goTo]);

  const goPrev = useCallback(() => {
    goTo(activeIndex - 1);
  }, [activeIndex, goTo]);

  useEffect(() => {
    if (!hasMultiple || isPaused || prefersReducedMotion()) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % photoCount);
    }, AUTO_ADVANCE_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [activeIndex, hasMultiple, isPaused, photoCount]);

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsPaused(false);
    }
  };

  const caption =
    activePhoto.caption && activePhoto.caption !== placeName
      ? activePhoto.caption
      : null;

  return (
    <div
      className={styles.gallery}
      tabIndex={hasMultiple ? 0 : undefined}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={handleBlur}
      onKeyDown={(event) => {
        if (!hasMultiple) {
          return;
        }

        if (event.key === "ArrowRight") {
          event.preventDefault();
          goNext();
        }

        if (event.key === "ArrowLeft") {
          event.preventDefault();
          goPrev();
        }
      }}
    >
      <div className={styles.imageArea}>
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className={
              index === activeIndex
                ? `${styles.slide} ${styles.slideActive}`
                : styles.slide
            }
            aria-hidden={index !== activeIndex}
          >
            <SignedPhoto
              photoId={photo.id}
              src={photo.url}
              expiresAt={photo.expiresAt}
              alt={photo.caption ?? placeName}
            />
          </div>
        ))}
      </div>

      {hasMultiple ? (
        <div className={styles.controls}>
          <button
            className={styles.navButton}
            type="button"
            aria-label="Previous photo"
            onClick={goPrev}
          >
            ‹
          </button>
          <div className={styles.dots} role="tablist" aria-label="Photos">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                className={
                  index === activeIndex ? styles.dotActive : styles.dot
                }
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`Photo ${index + 1} of ${photoCount}`}
                onClick={() => goTo(index)}
              />
            ))}
          </div>
          <button
            className={styles.navButton}
            type="button"
            aria-label="Next photo"
            onClick={goNext}
          >
            ›
          </button>
        </div>
      ) : null}

      {caption ? <p className={styles.caption}>{caption}</p> : null}
    </div>
  );
}
