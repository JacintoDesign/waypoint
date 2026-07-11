import { notFound } from "next/navigation";
import { GuideViewer } from "@/components/guide-viewer";
import { resolveCoverPhotoSrc } from "@/lib/guide-covers";
import { getPublicGuideBySlug } from "@/queries/guides";
import { getPrimarySignedPhotosByPlaceIds } from "@/queries/photos";
import { getPlacesByGuideId } from "@/queries/places";
import styles from "./page.module.css";

type PublicGuidePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PublicGuidePage({ params }: PublicGuidePageProps) {
  const { slug } = await params;
  const guide = await getPublicGuideBySlug(slug);

  if (!guide) {
    notFound();
  }

  const places = await getPlacesByGuideId(guide.id);
  const photosByPlaceId = places.length
    ? await getPrimarySignedPhotosByPlaceIds(places.map((place) => place.id))
    : new Map();

  const placesWithPhotos = places.map((place) => ({
    id: place.id,
    name: place.name,
    address: place.address,
    category: place.category,
    location: place.location,
    photo: photosByPlaceId.get(place.id),
  }));

  const coverPhotoSrc = await resolveCoverPhotoSrc(guide.coverPhotoUrl);

  return (
    <main className={styles.page}>
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
