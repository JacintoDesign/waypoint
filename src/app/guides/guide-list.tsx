"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CachedImage } from "@/components/cached-image";
import {
  coverListCacheKey,
  preloadCachedImages,
} from "@/lib/image-cache";
import type { GuideListItem } from "@/types/guide";
import styles from "./guide-list.module.css";

type GuideListVariant = "author" | "public";

type GuideListProps = {
  guides: GuideListItem[];
  variant?: GuideListVariant;
};

type ViewMode = "grid" | "list";

function isViewMode(value: string | null): value is ViewMode {
  return value === "grid" || value === "list";
}

function GuideCover({ guide }: { guide: GuideListItem }) {
  if (!guide.coverPhotoSrc || !guide.coverPhotoUrl) {
    return <div className={styles.coverPlaceholder} aria-hidden="true" />;
  }

  return (
    <CachedImage
      cacheKey={coverListCacheKey(guide.coverPhotoUrl)}
      src={guide.coverPhotoSrc}
      alt=""
      className={styles.coverImage}
      readyClassName={styles.coverImageReady}
    />
  );
}

function GuideMeta({
  guide,
  variant,
}: {
  guide: GuideListItem;
  variant: GuideListVariant;
}) {
  if (variant === "public") {
    return <p className={styles.meta}>/g/{guide.slug}</p>;
  }

  return (
    <p className={styles.meta}>
      {guide.isPublic ? `Public · /g/${guide.slug}` : "Private"}
    </p>
  );
}

function GuideActions({
  guide,
  variant,
}: {
  guide: GuideListItem;
  variant: GuideListVariant;
}) {
  if (variant === "public") {
    return (
      <div className={styles.actions}>
        <Link
          className={`${styles.action} ${styles.actionPrimary}`}
          href={`/g/${guide.slug}`}
        >
          View
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.actions}>
      <Link
        className={`${styles.action} ${styles.actionPrimary}`}
        href={`/guides/${guide.id}`}
      >
        Edit
      </Link>
      <Link className={styles.action} href={`/g/${guide.slug}`}>
        View
      </Link>
    </div>
  );
}

function readViewFromLocation(): ViewMode {
  if (typeof window === "undefined") {
    return "grid";
  }

  const requestedView = new URLSearchParams(window.location.search).get("view");
  return isViewMode(requestedView) ? requestedView : "grid";
}

export function GuideList({ guides, variant = "author" }: GuideListProps) {
  const searchParams = useSearchParams();
  const requestedView = searchParams.get("view");
  const initialView: ViewMode = isViewMode(requestedView) ? requestedView : "grid";
  const [view, setView] = useState<ViewMode>(initialView);

  useEffect(() => {
    preloadCachedImages(
      guides.flatMap((guide) =>
        guide.coverPhotoSrc && guide.coverPhotoUrl
          ? [
              {
                cacheKey: coverListCacheKey(guide.coverPhotoUrl),
                src: guide.coverPhotoSrc,
              },
            ]
          : [],
      ),
    );
  }, [guides]);

  useEffect(() => {
    function syncViewFromLocation() {
      setView(readViewFromLocation());
    }

    syncViewFromLocation();
    window.addEventListener("popstate", syncViewFromLocation);
    return () => {
      window.removeEventListener("popstate", syncViewFromLocation);
    };
  }, []);

  function setViewMode(nextView: ViewMode) {
    setView(nextView);

    const params = new URLSearchParams(window.location.search);
    params.set("view", nextView);
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(window.history.state, "", nextUrl);
  }

  if (guides.length === 0) {
    if (variant === "public") {
      return (
        <div className={styles.emptyState}>
          <p className={styles.empty}>No public guides available.</p>
        </div>
      );
    }

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
            onClick={() => setViewMode("grid")}
          >
            Grid
          </button>
          <button
            className={`${styles.viewButton} ${
              view === "list" ? styles.viewButtonActive : ""
            }`}
            type="button"
            aria-pressed={view === "list"}
            onClick={() => setViewMode("list")}
          >
            List
          </button>
        </div>
      </div>

      <ul
        className={view === "grid" ? styles.grid : styles.list}
        data-view={view}
      >
        {guides.map((guide) => {
          const guideHref =
            variant === "public" ? `/g/${guide.slug}` : `/guides/${guide.id}`;

          return (
            <li
              key={guide.id}
              className={view === "grid" ? styles.gridCard : styles.listCard}
            >
              <Link
                className={
                  view === "grid" ? styles.gridCoverLink : styles.listCoverLink
                }
                href={guideHref}
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
                  <Link className={styles.guideLink} href={guideHref}>
                    {guide.title}
                  </Link>
                </h2>
                <GuideMeta guide={guide} variant={variant} />
                <GuideActions guide={guide} variant={variant} />
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
