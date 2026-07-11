import Link from "next/link";
import { notFound } from "next/navigation";
import { CoverPhotoEditor } from "@/app/guides/[guideId]/cover-photo-editor";
import { GuideEditor } from "@/app/guides/[guideId]/guide-editor";
import { PublishEditor } from "@/app/guides/[guideId]/publish-editor";
import { requireAuthor } from "@/lib/auth";
import { resolveCoverPhotoSrc } from "@/lib/guide-covers";
import { getGuideByIdForUser } from "@/queries/guides";
import { getPhotosByPlaceIds, getSignedPhotosByPlaceIds } from "@/queries/photos";
import { getPlacesByGuideId } from "@/queries/places";
import type { GuideCoverPhotoOption } from "@/types/guide";
import styles from "./page.module.css";

type GuideEditorPageProps = {
  params: Promise<{
    guideId: string;
  }>;
  searchParams: Promise<{
    coverError?: string;
  }>;
};

export default async function GuideEditorPage({
  params,
  searchParams,
}: GuideEditorPageProps) {
  const user = await requireAuthor();
  const { guideId } = await params;
  const { coverError } = await searchParams;
  const guide = await getGuideByIdForUser(guideId, user.id);

  if (!guide) {
    notFound();
  }

  const places = await getPlacesByGuideId(guide.id);
  const placeIds = places.map((place) => place.id);
  const photoRows = await getPhotosByPlaceIds(placeIds);
  const signedPhotos = await getSignedPhotosByPlaceIds(placeIds);
  const storagePathByPhotoId = new Map(
    photoRows.map((row) => [row.id, row.storage_path]),
  );
  const placeNameById = new Map(places.map((place) => [place.id, place.name]));

  const photoOptions: GuideCoverPhotoOption[] = signedPhotos.map((photo) => {
    const storagePath = storagePathByPhotoId.get(photo.id) ?? "";

    return {
      id: photo.id,
      placeName: placeNameById.get(photo.placeId) ?? "Place",
      caption: photo.caption,
      storagePath,
      url: photo.url,
      expiresAt: photo.expiresAt,
      isSelected: Boolean(
        guide.coverPhotoUrl && guide.coverPhotoUrl === storagePath,
      ),
    };
  });

  const currentCoverSrc = await resolveCoverPhotoSrc(guide.coverPhotoUrl);

  const photosByPlaceId = new Map<string, typeof signedPhotos>();
  for (const photo of signedPhotos) {
    const existing = photosByPlaceId.get(photo.placeId) ?? [];
    existing.push(photo);
    photosByPlaceId.set(photo.placeId, existing);
  }

  const editorPlaces = places.map((place) => ({
    ...place,
    photos: photosByPlaceId.get(place.id) ?? [],
  }));

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.back} href="/guides">
          All guides
        </Link>
      </header>

      <PublishEditor guide={guide} />

      <CoverPhotoEditor
        guideId={guide.id}
        currentCoverSrc={currentCoverSrc}
        photoOptions={photoOptions}
        initialError={
          coverError === "1"
            ? "Cover photo could not be saved. Try uploading again below."
            : null
        }
      />

      <GuideEditor guideId={guide.id} places={editorPlaces} />
    </main>
  );
}
