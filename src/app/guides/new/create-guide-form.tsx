"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createGuideAction, type CreateGuideState } from "@/app/guides/actions";
import { maxImageSizeLabel } from "@/lib/place-photos";
import styles from "./page.module.css";

const initialState: CreateGuideState = { error: null };

export function CreateGuideForm() {
  const [state, formAction, pending] = useActionState(
    createGuideAction,
    initialState,
  );

  return (
    <form className={styles.form} action={formAction}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="title">
          Title
        </label>
        <input
          id="title"
          className={styles.input}
          type="text"
          name="title"
          required
          autoFocus
          disabled={pending}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          className={styles.textarea}
          name="description"
          rows={4}
          disabled={pending}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="coverPhoto">
          Cover photo
        </label>
        <input
          id="coverPhoto"
          className={styles.fileInput}
          type="file"
          name="coverPhoto"
          accept="image/jpeg,image/png,image/webp"
          disabled={pending}
        />
        <p className={styles.hint}>
          Optional. JPEG, PNG, or WebP up to {maxImageSizeLabel()}. Shown on your guide list and share page.
        </p>
      </div>

      {state.error ? <p className={styles.error}>{state.error}</p> : null}

      <div className={styles.formActions}>
        <button
          className={`${styles.button} ${styles.buttonPrimary}`}
          type="submit"
          disabled={pending}
        >
          {pending ? "Creating…" : "Create guide"}
        </button>
        <Link className={styles.button} href="/guides">
          Cancel
        </Link>
      </div>
    </form>
  );
}
