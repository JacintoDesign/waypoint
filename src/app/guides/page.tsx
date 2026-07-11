import Link from "next/link";
import { Suspense } from "react";
import { SignOutButton } from "@/app/guides/sign-out-button";
import { GuideList } from "@/app/guides/guide-list";
import { requireAuthor } from "@/lib/auth";
import { resolveCoverPhotoSrcs } from "@/lib/guide-covers";
import { getGuidesByUserId } from "@/queries/guides";
import type { GuideListItem } from "@/types/guide";
import styles from "./page.module.css";

export default async function GuidesPage() {
  const user = await requireAuthor();
  const guides = await getGuidesByUserId(user.id);
  const coverSrcByValue = await resolveCoverPhotoSrcs(
    guides.map((guide) => guide.coverPhotoUrl),
  );
  const guideItems: GuideListItem[] = guides.map((guide) => ({
    ...guide,
    coverPhotoSrc: guide.coverPhotoUrl
      ? (coverSrcByValue.get(guide.coverPhotoUrl) ?? null)
      : null,
  }));

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Your guides</h1>
          <p className={styles.lede}>Edit places, photos, and notes for each guide.</p>
        </div>
        <div className={styles.headerActions}>
          <Link className={`${styles.headerButton} ${styles.headerButtonPrimary}`} href="/guides/new">
            New guide
          </Link>
          <SignOutButton />
        </div>
      </header>

      <Suspense fallback={<p className={styles.empty}>Loading guides…</p>}>
        <GuideList guides={guideItems} />
      </Suspense>
    </main>
  );
}
