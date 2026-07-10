import { GuideViewer } from "@/components/guide-viewer";
import { getPublicGuideBySlug } from "@/queries/guides";
import { getPrimarySignedPhotosByPlaceIds } from "@/queries/photos";
import { getPlacesByGuideId } from "@/queries/places";
import styles from "./page.module.css";

const COPENHAGEN_GUIDE_SLUG = "copenhagen-again";

export default async function HomePage() {
  const guide = await getPublicGuideBySlug(COPENHAGEN_GUIDE_SLUG);
  const places = guide ? await getPlacesByGuideId(guide.id) : [];
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

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{guide?.title ?? "Waypoint"}</h1>
        {guide?.description ? (
          <p className={styles.description}>{guide.description}</p>
        ) : null}
      </header>
      <GuideViewer places={placesWithPhotos} />
    </main>
  );
}
