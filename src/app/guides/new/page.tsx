import Link from "next/link";
import { requireAuthor } from "@/lib/auth";
import { CreateGuideForm } from "./create-guide-form";
import styles from "./page.module.css";

export default async function NewGuidePage() {
  await requireAuthor();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.back} href="/guides">
          All guides
        </Link>
        <h1 className={styles.title}>New guide</h1>
        <p className={styles.lede}>
          Start with a title. You can add places, photos, and notes in the editor.
        </p>
      </header>

      <CreateGuideForm />
    </main>
  );
}
