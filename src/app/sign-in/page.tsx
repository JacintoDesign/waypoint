import { Suspense } from "react";
import { SignInForm } from "@/app/sign-in/sign-in-form";
import styles from "./page.module.css";

export default function SignInPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>Author access</p>
        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.lede}>
          Sign in to edit your guides. Public guides stay open to everyone.
        </p>
        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>
      </section>
    </main>
  );
}
