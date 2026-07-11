"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  selectGuideCoverPhotoAction,
  uploadGuideCoverAction,
} from "@/app/guides/[guideId]/actions";
import { coverPhotoActionInitialState } from "@/app/guides/[guideId]/cover-photo-state";
import { SignedPhoto } from "@/components/signed-photo";
import type { GuideCoverPhotoOption } from "@/types/guide";
import styles from "./cover-photo-editor.module.css";

type CoverPhotoEditorProps = {
  guideId: string;
  currentCoverSrc: string | null;
  photoOptions: GuideCoverPhotoOption[];
  initialError?: string | null;
};

export function CoverPhotoEditor({
  guideId,
  currentCoverSrc,
  photoOptions,
  initialError = null,
}: CoverPhotoEditorProps) {
  const router = useRouter();
  const [uploadState, uploadAction, uploadPending] = useActionState(
    uploadGuideCoverAction,
    coverPhotoActionInitialState,
  );
  const [selectState, selectAction, selectPending] = useActionState(
    selectGuideCoverPhotoAction,
    coverPhotoActionInitialState,
  );

  const feedback =
    uploadState.error || uploadState.success ? uploadState : selectState;
  const isPending = uploadPending || selectPending;

  useEffect(() => {
    if (uploadState.success || selectState.success) {
      router.refresh();
    }
  }, [uploadState.success, selectState.success, router]);

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Cover photo</h2>
        <p className={styles.sectionCopy}>
          Shown on your guide list and public share page.
        </p>
      </div>

      <div className={styles.currentCover}>
        {currentCoverSrc ? (
          // eslint-disable-next-line @next/next/no-img-element -- cover may be external or signed
          <img
            className={styles.currentCoverImage}
            src={currentCoverSrc}
            alt=""
          />
        ) : (
          <div className={styles.currentCoverPlaceholder} aria-hidden="true" />
        )}
      </div>

      <form className={styles.uploadForm} action={uploadAction}>
        <input type="hidden" name="guideId" value={guideId} />
        <label className={styles.uploadLabel} htmlFor={`cover-upload-${guideId}`}>
          Upload cover
        </label>
        <input
          id={`cover-upload-${guideId}`}
          className={styles.fileInput}
          type="file"
          name="coverPhoto"
          accept="image/jpeg,image/png,image/webp"
          disabled={isPending}
        />
        <button
          className={`${styles.button} ${styles.buttonPrimary}`}
          type="submit"
          disabled={isPending}
        >
          {uploadPending ? "Uploading…" : "Save upload"}
        </button>
      </form>

      {photoOptions.length > 0 ? (
        <div className={styles.picker}>
          <h3 className={styles.pickerTitle}>Choose from this guide</h3>
          <ul className={styles.photoGrid}>
            {photoOptions.map((photo) => (
              <li key={photo.id} className={styles.photoOption}>
                <form action={selectAction}>
                  <input type="hidden" name="guideId" value={guideId} />
                  <input type="hidden" name="photoId" value={photo.id} />
                  <button
                    className={`${styles.photoButton} ${
                      photo.isSelected ? styles.photoButtonSelected : ""
                    }`}
                    type="submit"
                    disabled={isPending || photo.isSelected}
                    aria-pressed={photo.isSelected}
                  >
                    <SignedPhoto
                      photoId={photo.id}
                      src={photo.url}
                      expiresAt={photo.expiresAt}
                      alt={photo.caption ?? photo.placeName}
                      className={styles.photoThumb}
                    />
                    <span className={styles.photoLabel}>{photo.placeName}</span>
                    {photo.isSelected ? (
                      <span className={styles.selectedBadge}>Current cover</span>
                    ) : null}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className={styles.emptyPhotos}>
          Add place photos to this guide, then pick one here as the cover.
        </p>
      )}

      {initialError ? <p className={styles.error}>{initialError}</p> : null}
      {feedback.error ? <p className={styles.error}>{feedback.error}</p> : null}
      {feedback.success ? (
        <p className={styles.success}>{feedback.success}</p>
      ) : null}
    </section>
  );
}
