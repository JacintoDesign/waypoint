import Link from "next/link";
import { Suspense } from "react";
import { SignOutButton } from "@/app/guides/sign-out-button";
import { GuideList } from "@/app/guides/guide-list";
import { getSessionUser } from "@/lib/auth";
import { resolveCoverPhotoSrcs } from "@/lib/guide-covers";
import { getGuidesByUserId, getPublicGuides } from "@/queries/guides";
import type { GuideListItem } from "@/types/guide";
import styles from "./page.module.css";

async function buildGuideListItems(
  guides: Awaited<ReturnType<typeof getPublicGuides>>,
): Promise<GuideListItem[]> {
  const coverSrcByValue = await resolveCoverPhotoSrcs(
    guides.map((guide) => guide.coverPhotoUrl),
  );

  return guides.map((guide) => ({
    ...guide,
    coverPhotoSrc: guide.coverPhotoUrl
      ? (coverSrcByValue.get(guide.coverPhotoUrl) ?? null)
      : null,
  }));
}

export default async function GuidesPage() {
  const user = await getSessionUser();

  if (user) {
    const guides = await getGuidesByUserId(user.id);
    const guideItems = await buildGuideListItems(guides);

    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Your guides</h1>
            <p className={styles.lede}>
              Edit places, photos, and notes for each guide.
            </p>
          </div>
          <div className={styles.headerActions}>
            <Link
              className={`${styles.headerButton} ${styles.headerButtonPrimary}`}
              href="/guides/new"
            >
              New guide
            </Link>
            <SignOutButton />
          </div>
        </header>

        <Suspense fallback={<p className={styles.empty}>Loading guides…</p>}>
          <GuideList guides={guideItems} variant="author" />
        </Suspense>
      </main>
    );
  }

  const guides = await getPublicGuides();
  const guideItems = await buildGuideListItems(guides);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Guides</h1>
          <p className={styles.lede}>Browse public travel guides.</p>
        </div>
        <div className={styles.headerActions}>
          <Link className={styles.headerButton} href="/sign-in">
            Sign in
          </Link>
        </div>
      </header>

      <Suspense fallback={<p className={styles.empty}>Loading guides…</p>}>
        <GuideList guides={guideItems} variant="public" />
      </Suspense>
    </main>
  );
}
