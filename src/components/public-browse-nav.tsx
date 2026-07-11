import Link from "next/link";
import styles from "./public-browse-nav.module.css";

export function PublicBrowseNav() {
  return (
    <nav className={styles.topNav} aria-label="Browse">
      <Link className={styles.link} href="/guides">
        All guides
      </Link>
    </nav>
  );
}
