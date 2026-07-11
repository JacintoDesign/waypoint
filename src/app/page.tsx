import { redirect } from "next/navigation";

const DEFAULT_PUBLIC_GUIDE_SLUG = "copenhagen-again";

export default function HomePage() {
  redirect(`/g/${DEFAULT_PUBLIC_GUIDE_SLUG}`);
}
