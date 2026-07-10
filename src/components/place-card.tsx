import { SignedPhoto } from "@/components/signed-photo";
import { buildGeoDirectionsHref } from "@/lib/geo-link";
import type { Place } from "@/types/place";
import type { SignedPlacePhoto } from "@/types/photo";
import styles from "./place-card.module.css";

export type PlaceCardPlace = Pick<
  Place,
  "id" | "name" | "address" | "category" | "location"
> & {
  photo?: SignedPlacePhoto;
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
  const photoAlt = place.photo?.caption ?? place.name;

  return (
    <article
      className={isActive ? `${styles.card} ${styles.cardActive}` : styles.card}
      data-place-id={place.id}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {place.photo ? (
        <div className={styles.photoFrame}>
          <SignedPhoto
            photoId={place.photo.id}
            src={place.photo.url}
            expiresAt={place.photo.expiresAt}
            alt={photoAlt}
          />
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
        {place.photo?.caption && place.photo.caption !== place.name ? (
          <p className={styles.caption}>{place.photo.caption}</p>
        ) : null}
      </div>
    </article>
  );
}
