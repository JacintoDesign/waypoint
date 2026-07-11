"use server";

import { revalidatePath } from "next/cache";
import { requireAuthor } from "@/lib/auth";
import { uploadGuideCoverPhoto, validateCoverImageFile } from "@/lib/guide-covers";
import { getGuideByIdForUser, updateGuideCoverPhoto } from "@/queries/guides";
import { getAccessiblePhotoById } from "@/queries/photos";
import { getPlacesByGuideId } from "@/queries/places";
import type { CoverPhotoActionState } from "@/app/guides/[guideId]/cover-photo-state";

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

function revalidateGuidePaths(guideId: string, slug: string, isPublic: boolean) {
  revalidatePath("/guides");
  revalidatePath(`/guides/${guideId}`);

  if (isPublic) {
    revalidatePath(`/g/${slug}`);
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
