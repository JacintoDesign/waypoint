import Link from "next/link";
import { notFound } from "next/navigation";
import { GuideViewer } from "@/components/guide-viewer";
import { PublicBrowseNav } from "@/components/public-browse-nav";
import { getSessionUser } from "@/lib/auth";
import { resolveCoverPhotoSrc } from "@/lib/guide-covers";
import { getGuideBySlug } from "@/queries/guides";
import { getSignedPhotosGroupedByPlaceIds } from "@/queries/photos";
import { getPlacesByGuideId } from "@/queries/places";
import styles from "./page.module.css";

type PublicGuidePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PublicGuidePage({ params }: PublicGuidePageProps) {
  const { slug } = await params;
  const [guide, user] = await Promise.all([getGuideBySlug(slug), getSessionUser()]);

  if (!guide) {
    notFound();
  }

  const isOwnerPreview = !guide.isPublic && user?.id === guide.userId;

  const places = await getPlacesByGuideId(guide.id);
  const photosByPlaceId = places.length
    ? await getSignedPhotosGroupedByPlaceIds(places.map((place) => place.id))
    : new Map();

  const placesWithPhotos = places.map((place) => ({
    id: place.id,
    name: place.name,
    address: place.address,
    category: place.category,
    location: place.location,
    photos: photosByPlaceId.get(place.id) ?? [],
  }));

  const coverPhotoSrc = await resolveCoverPhotoSrc(guide.coverPhotoUrl);

  return (
    <main className={styles.page}>
      <PublicBrowseNav />

      {isOwnerPreview ? (
        <div className={styles.previewBanner}>
          <p className={styles.previewCopy}>
            This guide is private. Only you can see this preview.
          </p>
          <Link className={styles.previewLink} href={`/guides/${guide.id}`}>
            Edit guide
          </Link>
        </div>
      ) : null}

      {coverPhotoSrc ? (
        <div className={styles.coverFrame}>
          <img
            className={styles.coverImage}
            src={coverPhotoSrc}
            alt=""
          />
        </div>
      ) : null}

      <header className={styles.header}>
        <h1 className={styles.title}>{guide.title}</h1>
        {guide.description ? (
          <p className={styles.description}>{guide.description}</p>
        ) : null}
      </header>

      <GuideViewer places={placesWithPhotos} />
    </main>
  );
}
