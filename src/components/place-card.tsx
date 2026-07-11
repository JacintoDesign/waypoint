import { PlacePhotoGallery } from "@/components/place-photo-gallery";
import { buildGeoDirectionsHref } from "@/lib/geo-link";
import type { Place } from "@/types/place";
import type { SignedPlacePhoto } from "@/types/photo";
import styles from "./place-card.module.css";

export type PlaceCardPlace = Pick<
  Place,
  "id" | "name" | "address" | "category" | "location"
> & {
  photos?: SignedPlacePhoto[];
};

export type PlaceCardProps = {
  place: PlaceCardPlace;
  isActive?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

export function PlaceCard({
  place,
  isActive = false,
  onMouseEnter,
  onMouseLeave,
}: PlaceCardProps) {
  const photos = place.photos ?? [];

  return (
    <article
      className={isActive ? `${styles.card} ${styles.cardActive}` : styles.card}
      data-place-id={place.id}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {photos.length > 0 ? (
        <div className={styles.photoFrame}>
          <PlacePhotoGallery photos={photos} placeName={place.name} />
        </div>
      ) : null}
      <div className={styles.body}>
        <h2 className={styles.name}>{place.name}</h2>
        {place.address ? (
          <p className={styles.address}>{place.address}</p>
        ) : null}
        <div className={styles.metaRow}>
          {place.category ? (
            <span className={styles.category}>{place.category}</span>
          ) : null}
          <a
            className={styles.directionsButton}
            href={buildGeoDirectionsHref(place.location)}
            aria-label={`Directions to ${place.name}`}
          >
            Directions
          </a>
        </div>
      </div>
    </article>
  );
}
