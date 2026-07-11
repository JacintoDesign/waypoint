"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { GuideListItem } from "@/types/guide";
import styles from "./guide-list.module.css";

type GuideListProps = {
  guides: GuideListItem[];
};

type ViewMode = "grid" | "list";

function isViewMode(value: string | null): value is ViewMode {
  return value === "grid" || value === "list";
}

function GuideCover({ guide }: { guide: GuideListItem }) {
  if (guide.coverPhotoSrc) {
    return (
      <img
        className={styles.coverImage}
        src={guide.coverPhotoSrc}
        alt=""
        loading="lazy"
      />
    );
  }

  return <div className={styles.coverPlaceholder} aria-hidden="true" />;
}

function GuideMeta({ guide }: { guide: GuideListItem }) {
  return (
    <p className={styles.meta}>
      {guide.isPublic ? `Public · /g/${guide.slug}` : "Private"}
    </p>
  );
}

function GuideActions({ guide }: { guide: GuideListItem }) {
  return (
    <div className={styles.actions}>
      <Link
        className={`${styles.action} ${styles.actionPrimary}`}
        href={`/guides/${guide.id}`}
      >
        Edit
      </Link>
      {guide.isPublic ? (
        <Link className={styles.action} href={`/g/${guide.slug}`}>
          View
        </Link>
      ) : null}
    </div>
  );
}

export function GuideList({ guides }: GuideListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedView = searchParams.get("view");
  const view: ViewMode = isViewMode(requestedView) ? requestedView : "grid";

  function setView(nextView: ViewMode) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", nextView);
    router.replace(`/guides?${params.toString()}`, { scroll: false });
  }

  if (guides.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.empty}>No guides yet.</p>
        <Link className={`${styles.action} ${styles.actionPrimary}`} href="/guides/new">
          Create your first guide
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className={styles.toolbar}>
        <p className={styles.toolbarLabel}>Layout</p>
        <div className={styles.viewToggle} role="group" aria-label="Guide layout">
          <button
            className={`${styles.viewButton} ${
              view === "grid" ? styles.viewButtonActive : ""
            }`}
            type="button"
            aria-pressed={view === "grid"}
            onClick={() => setView("grid")}
          >
            Grid
          </button>
          <button
            className={`${styles.viewButton} ${
              view === "list" ? styles.viewButtonActive : ""
            }`}
            type="button"
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
          >
            List
          </button>
        </div>
      </div>

      <ul
        className={view === "grid" ? styles.grid : styles.list}
        data-view={view}
      >
        {guides.map((guide) => (
          <li
            key={guide.id}
            className={view === "grid" ? styles.gridCard : styles.listCard}
          >
            <Link
              className={
                view === "grid" ? styles.gridCoverLink : styles.listCoverLink
              }
              href={`/guides/${guide.id}`}
              tabIndex={-1}
              aria-hidden="true"
            >
              <div
                className={
                  view === "grid" ? styles.gridCover : styles.listCover
                }
              >
                <GuideCover guide={guide} />
              </div>
            </Link>

            <div className={styles.cardBody}>
              <h2 className={styles.guideTitle}>
                <Link className={styles.guideLink} href={`/guides/${guide.id}`}>
                  {guide.title}
                </Link>
              </h2>
              <GuideMeta guide={guide} />
              <GuideActions guide={guide} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
