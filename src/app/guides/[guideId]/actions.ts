"use server";

import { revalidatePath } from "next/cache";
import { requireAuthor } from "@/lib/auth";
import {
  isValidGuideSlug,
  normalizeGuideSlug,
} from "@/lib/guide-slug";
import { uploadGuideCoverPhoto, validateCoverImageFile } from "@/lib/guide-covers";
import {
  getGuideByIdForUser,
  isGuideSlugTaken,
  updateGuideCoverPhoto,
  updateGuideDetails,
} from "@/queries/guides";
import { getAccessiblePhotoById } from "@/queries/photos";
import { getPlacesByGuideId } from "@/queries/places";
import type { CoverPhotoActionState } from "@/app/guides/[guideId]/cover-photo-state";
import type { PublishActionState } from "@/app/guides/[guideId]/publish-state";

function readGuideId(formData: FormData): string | null {
  const guideId = formData.get("guideId");
  if (typeof guideId !== "string" || guideId.trim() === "") {
    return null;
  }

  return guideId;
}

async function assertGuideOwner(guideId: string) {
  const user = await requireAuthor();
  const guide = await getGuideByIdForUser(guideId, user.id);

  if (!guide) {
    throw new Error("Guide not found.");
  }

  return { user, guide };
}

function revalidateGuidePaths(
  guideId: string,
  slug: string,
  isPublic: boolean,
  previousSlug?: string,
) {
  revalidatePath("/guides");
  revalidatePath(`/guides/${guideId}`);
  revalidatePath(`/g/${slug}`);

  if (previousSlug && previousSlug !== slug) {
    revalidatePath(`/g/${previousSlug}`);
  }

  if (!isPublic && previousSlug) {
    revalidatePath(`/g/${previousSlug}`);
  }
}

export async function updateGuidePublishAction(
  _previousState: PublishActionState,
  formData: FormData,
): Promise<PublishActionState> {
  const guideId = readGuideId(formData);
  if (!guideId) {
    return { error: "Guide not found.", success: null };
  }

  let guideContext;

  try {
    guideContext = await assertGuideOwner(guideId);
  } catch {
    return { error: "Guide not found.", success: null };
  }

  const title = formData.get("title");
  if (typeof title !== "string" || title.trim() === "") {
    return { error: "Title is required.", success: null };
  }

  const description = formData.get("description");
  const slugInput = formData.get("slug");
  if (typeof slugInput !== "string" || slugInput.trim() === "") {
    return { error: "Slug is required.", success: null };
  }

  const slug = normalizeGuideSlug(slugInput);
  if (!isValidGuideSlug(slug)) {
    return {
      error: "Slug must use lowercase letters, numbers, and hyphens only.",
      success: null,
    };
  }

  const isPublic = formData.get("isPublic") === "true";

  try {
    if (await isGuideSlugTaken(slug, guideId)) {
      return { error: "That slug is already taken. Choose another.", success: null };
    }

    const guide = await updateGuideDetails({
      guideId,
      userId: guideContext.user.id,
      title: title.trim(),
      description:
        typeof description === "string" && description.trim()
          ? description.trim()
          : null,
      slug,
      isPublic,
    });

    revalidateGuidePaths(
      guide.id,
      guide.slug,
      guide.isPublic,
      guideContext.guide.slug,
    );

    const statusMessage = guide.isPublic
      ? "Guide published."
      : "Guide saved as private.";

    return { error: null, success: statusMessage };
  } catch {
    return { error: "Could not save guide settings.", success: null };
  }
}

export async function uploadGuideCoverAction(
  _previousState: CoverPhotoActionState,
  formData: FormData,
): Promise<CoverPhotoActionState> {
  const guideId = readGuideId(formData);
  if (!guideId) {
    return { error: "Guide not found.", success: null };
  }

  let guideContext;

  try {
    guideContext = await assertGuideOwner(guideId);
  } catch {
    return { error: "Guide not found.", success: null };
  }

  const coverPhoto = formData.get("coverPhoto");
  if (!(coverPhoto instanceof File) || coverPhoto.size === 0) {
    return { error: "Choose a cover photo to upload.", success: null };
  }

  const validationError = validateCoverImageFile(coverPhoto);
  if (validationError) {
    return { error: validationError, success: null };
  }

  try {
    const storagePath = await uploadGuideCoverPhoto(guideId, coverPhoto);
    const guide = await updateGuideCoverPhoto(
      guideId,
      guideContext.user.id,
      storagePath,
    );
    revalidateGuidePaths(guide.id, guide.slug, guide.isPublic);
    return { error: null, success: "Cover photo updated." };
  } catch {
    return { error: "Could not upload cover photo.", success: null };
  }
}

export async function selectGuideCoverPhotoAction(
  _previousState: CoverPhotoActionState,
  formData: FormData,
): Promise<CoverPhotoActionState> {
  const guideId = readGuideId(formData);
  if (!guideId) {
    return { error: "Guide not found.", success: null };
  }

  let guideContext;

  try {
    guideContext = await assertGuideOwner(guideId);
  } catch {
    return { error: "Guide not found.", success: null };
  }

  const photoId = formData.get("photoId");
  if (typeof photoId !== "string" || photoId.trim() === "") {
    return { error: "Choose a photo from this guide.", success: null };
  }

  const photo = await getAccessiblePhotoById(photoId);
  if (!photo) {
    return { error: "Photo not found.", success: null };
  }

  const places = await getPlacesByGuideId(guideId);
  if (!places.some((place) => place.id === photo.place_id)) {
    return { error: "That photo does not belong to this guide.", success: null };
  }

  try {
    const guide = await updateGuideCoverPhoto(
      guideId,
      guideContext.user.id,
      photo.storage_path,
    );
    revalidateGuidePaths(guide.id, guide.slug, guide.isPublic);
    return { error: null, success: "Cover photo updated." };
  } catch {
    return { error: "Could not update cover photo.", success: null };
  }
}
