"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateGuidePublishAction } from "@/app/guides/[guideId]/actions";
import { publishActionInitialState } from "@/app/guides/[guideId]/publish-state";
import { slugifyGuideTitle } from "@/lib/guide-slug";
import type { Guide } from "@/types/guide";
import styles from "./publish-editor.module.css";

type PublishEditorProps = {
  guide: Guide;
};

export function PublishEditor({ guide }: PublishEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(guide.title);
  const [description, setDescription] = useState(guide.description ?? "");
  const [slug, setSlug] = useState(guide.slug);
  const [isPublic, setIsPublic] = useState(guide.isPublic);
  const [slugCustomized, setSlugCustomized] = useState(
    slugifyGuideTitle(guide.title) !== guide.slug,
  );

  const [state, action, pending] = useActionState(
    updateGuidePublishAction,
    publishActionInitialState,
  );

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  useEffect(() => {
    setTitle(guide.title);
    setDescription(guide.description ?? "");
    setSlug(guide.slug);
    setIsPublic(guide.isPublic);
    setSlugCustomized(slugifyGuideTitle(guide.title) !== guide.slug);
  }, [guide]);

  const generateSlugFromTitle = () => {
    setSlug(slugifyGuideTitle(title));
    setSlugCustomized(false);
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugCustomized) {
      setSlug(slugifyGuideTitle(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlug(value);
    setSlugCustomized(true);
  };

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Sharing</h2>
        <p className={styles.sectionCopy}>
          Set the title, link, and visibility for your guide. Public guides open
          at their share link as a read-only view.
        </p>
      </div>

      <form className={styles.form} action={action}>
        <input type="hidden" name="guideId" value={guide.id} />
        <input type="hidden" name="isPublic" value={isPublic ? "true" : "false"} />

        <label className={styles.field}>
          <span className={styles.label}>Title</span>
          <input
            className={styles.input}
            name="title"
            value={title}
            onChange={(event) => handleTitleChange(event.target.value)}
            required
            disabled={pending}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Description</span>
          <textarea
            className={styles.textarea}
            name="description"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={pending}
          />
        </label>

        <div className={styles.slugField}>
          <span className={styles.label}>Share link</span>
          <div className={styles.slugInputRow}>
            <span className={styles.slugPrefix}>/g/</span>
            <input
              className={`${styles.input} ${styles.slugInput}`}
              name="slug"
              value={slug}
              onChange={(event) => handleSlugChange(event.target.value)}
              required
              disabled={pending}
              aria-label="Guide slug"
            />
          </div>
          <div className={styles.slugActions}>
            <button
              className={styles.textButton}
              type="button"
              onClick={generateSlugFromTitle}
              disabled={pending || title.trim() === ""}
            >
              Generate from title
            </button>
          </div>
        </div>

        <div className={styles.visibilityField}>
          <input
            id={`public-${guide.id}`}
            type="checkbox"
            checked={isPublic}
            onChange={(event) => setIsPublic(event.target.checked)}
            disabled={pending}
          />
          <div className={styles.visibilityCopy}>
            <label className={styles.visibilityLabel} htmlFor={`public-${guide.id}`}>
              Public guide
            </label>
            <p className={styles.visibilityHint}>
              {isPublic
                ? "Anyone with the link can view this guide."
                : "Only you can view this guide at its link until you publish."}
            </p>
            <p className={styles.shareLink}>
              Preview:{" "}
              <Link href={`/g/${slug}`} prefetch={false}>
                /g/{slug}
              </Link>
            </p>
          </div>
        </div>

        <div className={styles.formActions}>
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            type="submit"
            disabled={pending}
          >
            {pending ? "Saving…" : isPublic ? "Save and publish" : "Save"}
          </button>
        </div>

        {state.error ? <p className={styles.error}>{state.error}</p> : null}
        {state.success ? <p className={styles.success}>{state.success}</p> : null}
      </form>
    </section>
  );
}
