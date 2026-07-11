import Link from "next/link";
import { SignOutButton } from "@/app/guides/sign-out-button";
import { requireAuthor } from "@/lib/auth";
import { getGuidesByUserId } from "@/queries/guides";
import styles from "./page.module.css";

export default async function GuidesPage() {
  const user = await requireAuthor();
  const guides = await getGuidesByUserId(user.id);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Your guides</h1>
          <p className={styles.lede}>Edit places, photos, and notes for each guide.</p>
        </div>
        <SignOutButton />
      </header>

      {guides.length === 0 ? (
        <p className={styles.empty}>No guides yet.</p>
      ) : (
        <ul className={styles.list}>
          {guides.map((guide) => (
            <li key={guide.id} className={styles.card}>
              <div>
                <h2 className={styles.guideTitle}>
                  <Link className={styles.guideLink} href={`/guides/${guide.id}`}>
                    {guide.title}
                  </Link>
                </h2>
                <p className={styles.meta}>
                  {guide.isPublic ? `Public · /g/${guide.slug}` : "Private"}
                </p>
              </div>
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
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
