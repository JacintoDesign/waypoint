import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthor } from "@/lib/auth";
import { getGuideByIdForUser } from "@/queries/guides";
import { getPlacesByGuideId } from "@/queries/places";
import styles from "./page.module.css";

type GuideEditorPageProps = {
  params: Promise<{
    guideId: string;
  }>;
};

export default async function GuideEditorPage({ params }: GuideEditorPageProps) {
  const user = await requireAuthor();
  const { guideId } = await params;
  const guide = await getGuideByIdForUser(guideId, user.id);

  if (!guide) {
    notFound();
  }

  const places = await getPlacesByGuideId(guide.id);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.back} href="/guides">
          All guides
        </Link>
        <h1 className={styles.title}>{guide.title}</h1>
        {guide.description ? (
          <p className={styles.description}>{guide.description}</p>
        ) : null}
      </header>

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Editor</h2>
        <p className={styles.panelCopy}>
          {places.length === 0
            ? "This guide has no places yet. The editor opens without error."
            : `${places.length} place${places.length === 1 ? "" : "s"} in this guide.`}
        </p>
      </section>
    </main>
  );
}
