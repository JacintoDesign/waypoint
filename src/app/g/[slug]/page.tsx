import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GuideCoverImage } from "@/app/g/[slug]/guide-cover-image";
import { GuideViewer } from "@/components/guide-viewer";
import { PublicBrowseNav } from "@/components/public-browse-nav";
import { getSessionUser } from "@/lib/auth";
import { resolveCoverPhotoSrc } from "@/lib/guide-covers";
import { enrichPlacesWithAddresses } from "@/lib/resolve-place-address";
import { SITE_NAME } from "@/lib/site";
import { getGuideBySlug } from "@/queries/guides";
import { getSignedPhotosGroupedByPlaceIds } from "@/queries/photos";
import { getPlacesByGuideId } from "@/queries/places";
import styles from "./page.module.css";

type PublicGuidePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: PublicGuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);

  if (!guide) {
    return { title: "Guide not found" };
  }

  const description =
    guide.description ?? `A curated travel guide on ${SITE_NAME}.`;
  const coverPhotoSrc = await resolveCoverPhotoSrc(guide.coverPhotoUrl);
  const images = coverPhotoSrc
    ? [{ url: coverPhotoSrc, alt: guide.title }]
    : undefined;

  return {
    title: guide.title,
    description,
    robots: guide.isPublic ? undefined : { index: false, follow: false },
    openGraph: {
      title: guide.title,
      description,
      type: "article",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description,
      images: coverPhotoSrc ? [coverPhotoSrc] : undefined,
    },
  };
}

export default async function PublicGuidePage({ params }: PublicGuidePageProps) {
  const { slug } = await params;
  const [guide, user] = await Promise.all([getGuideBySlug(slug), getSessionUser()]);

  if (!guide) {
    notFound();
  }

  const isOwnerPreview = !guide.isPublic && user?.id === guide.userId;

  const places = await enrichPlacesWithAddresses(
    await getPlacesByGuideId(guide.id),
  );
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

      {coverPhotoSrc && guide.coverPhotoUrl ? (
        <GuideCoverImage
          coverPhotoUrl={guide.coverPhotoUrl}
          src={coverPhotoSrc}
        />
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
