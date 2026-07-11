"use client";

import { CachedImage } from "@/components/cached-image";
import { coverHeroCacheKey } from "@/lib/image-cache";
import styles from "./page.module.css";

type GuideCoverImageProps = {
  coverPhotoUrl: string;
  src: string;
};

export function GuideCoverImage({ coverPhotoUrl, src }: GuideCoverImageProps) {
  return (
    <div className={styles.coverFrame}>
      <CachedImage
        cacheKey={coverHeroCacheKey(coverPhotoUrl)}
        src={src}
        alt=""
        className={styles.coverImage}
      />
    </div>
  );
}
