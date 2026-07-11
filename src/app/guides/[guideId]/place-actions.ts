"use server";

import { revalidatePath } from "next/cache";
import { requireAuthor } from "@/lib/auth";
import {
  deletePlacePhotoStorage,
  uploadPlacePhoto,
  validatePlaceImageFile,
} from "@/lib/place-photo-upload";
import { getGuideByIdForUser } from "@/queries/guides";
import {
  deletePhotoById,
  getAccessiblePhotoById,
  getPhotosByPlaceIds,
  insertPhoto,
  updatePhotoSortOrders,
} from "@/queries/photos";
import {
  createPlace,
  deletePlace,
  getPlaceByIdForGuide,
  getPlacesByGuideId,
  updatePlace,
} from "@/queries/places";
import type { PlaceActionState } from "@/app/guides/[guideId]/place-state";
import type { PlaceLocation } from "@/types/place";

function readGuideId(formData: FormData): string | null {
  const guideId = formData.get("guideId");
  if (typeof guideId !== "string" || guideId.trim() === "") {
    return null;
  }

  return guideId;
}

function readPlaceId(formData: FormData): string | null {
  const placeId = formData.get("placeId");
  if (typeof placeId !== "string" || placeId.trim() === "") {
    return null;
  }

  return placeId;
}

function readLocation(formData: FormData): PlaceLocation | null {
  const lat = formData.get("lat");
  const lng = formData.get("lng");
  if (typeof lat !== "string" || typeof lng !== "string") {
    return null;
  }

  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (
    !Number.isFinite(latNum) ||
    !Number.isFinite(lngNum) ||
    latNum < -90 ||
    latNum > 90 ||
    lngNum < -180 ||
    lngNum > 180
  ) {
    return null;
  }

  return { lat: latNum, lng: lngNum };
}

function readRating(formData: FormData): number | null {
  const rating = formData.get("rating");
  if (typeof rating !== "string" || rating.trim() === "") {
    return null;
  }

  const value = Number(rating);
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    return null;
  }

  return value;
}

function readOptionalText(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

async function assertGuideOwner(guideId: string) {
  const user = await requireAuthor();
  const guide = await getGuideByIdForUser(guideId, user.id);

  if (!guide) {
    throw new Error("Guide not found.");
  }

  return guide;
}

function revalidateGuidePaths(guideId: string, slug: string, isPublic: boolean) {
  revalidatePath("/guides");
  revalidatePath(`/guides/${guideId}`);

  if (isPublic) {
    revalidatePath(`/g/${slug}`);
  }
}

export async function savePlaceAction(
  _previousState: PlaceActionState,
  formData: FormData,
): Promise<PlaceActionState> {
  const guideId = readGuideId(formData);
  if (!guideId) {
    return { error: "Guide not found.", success: null };
  }

  let guide;
  try {
    guide = await assertGuideOwner(guideId);
  } catch {
    return { error: "Guide not found.", success: null };
  }

  const name = readOptionalText(formData, "name");
  if (!name) {
    return { error: "Place name is required.", success: null };
  }

  const location = readLocation(formData);
  if (!location) {
    return { error: "Drop the place on the map first.", success: null };
  }

  const notes = readOptionalText(formData, "notes");
  const category = readOptionalText(formData, "category");
  const rating = readRating(formData);
  const placeId = readPlaceId(formData);

  try {
    if (placeId) {
      const existing = await getPlaceByIdForGuide(placeId, guideId);
      if (!existing) {
        return { error: "Place not found.", success: null };
      }

      await updatePlace({
        placeId,
        guideId,
        name,
        notes,
        category,
        rating,
        location,
      });

      revalidateGuidePaths(guide.id, guide.slug, guide.isPublic);
      return { error: null, success: "Place saved.", placeId };
    }

    const places = await getPlacesByGuideId(guideId);
    const sortOrder =
      places.length === 0
        ? 0
        : Math.max(...places.map((place) => place.sortOrder)) + 1;

    const created = await createPlace({
      guideId,
      name,
      notes,
      category,
      rating,
      location,
      sortOrder,
    });

    revalidateGuidePaths(guide.id, guide.slug, guide.isPublic);
    return { error: null, success: "Place saved.", placeId: created.id };
  } catch {
    return { error: "Could not save place.", success: null };
  }
}

export async function deletePlaceAction(
  _previousState: PlaceActionState,
  formData: FormData,
): Promise<PlaceActionState> {
  const guideId = readGuideId(formData);
  const placeId = readPlaceId(formData);
  if (!guideId || !placeId) {
    return { error: "Place not found.", success: null };
  }

  let guide;
  try {
    guide = await assertGuideOwner(guideId);
  } catch {
    return { error: "Guide not found.", success: null };
  }

  const existing = await getPlaceByIdForGuide(placeId, guideId);
  if (!existing) {
    return { error: "Place not found.", success: null };
  }

  try {
    const photos = await getPhotosByPlaceIds([placeId]);
    await deletePlace(placeId, guideId);

    for (const photo of photos) {
      try {
        await deletePlacePhotoStorage(photo.storage_path);
      } catch {
        // Storage cleanup is best-effort after the row is gone.
      }
    }

    revalidateGuidePaths(guide.id, guide.slug, guide.isPublic);
    return { error: null, success: "Place removed." };
  } catch {
    return { error: "Could not remove place.", success: null };
  }
}

export async function uploadPlacePhotoAction(
  _previousState: PlaceActionState,
  formData: FormData,
): Promise<PlaceActionState> {
  const guideId = readGuideId(formData);
  const placeId = readPlaceId(formData);
  if (!guideId || !placeId) {
    return { error: "Place not found.", success: null };
  }

  let guide;
  try {
    guide = await assertGuideOwner(guideId);
  } catch {
    return { error: "Guide not found.", success: null };
  }

  const existing = await getPlaceByIdForGuide(placeId, guideId);
  if (!existing) {
    return { error: "Place not found.", success: null };
  }

  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    return { error: "Choose a photo to upload.", success: null };
  }

  const validationError = validatePlaceImageFile(photo);
  if (validationError) {
    return { error: validationError, success: null };
  }

  try {
    const storagePath = await uploadPlacePhoto(guideId, placeId, photo);
    const photos = await getPhotosByPlaceIds([placeId]);
    const sortOrder =
      photos.length === 0
        ? 0
        : Math.max(...photos.map((row) => row.sort_order)) + 1;

    await insertPhoto({
      placeId,
      storagePath,
      sortOrder,
    });

    revalidateGuidePaths(guide.id, guide.slug, guide.isPublic);
    return { error: null, success: "Photo uploaded." };
  } catch {
    return { error: "Could not upload photo.", success: null };
  }
}

export async function deletePlacePhotoAction(
  _previousState: PlaceActionState,
  formData: FormData,
): Promise<PlaceActionState> {
  const guideId = readGuideId(formData);
  const placeId = readPlaceId(formData);
  const photoId = formData.get("photoId");
  if (!guideId || !placeId || typeof photoId !== "string" || photoId.trim() === "") {
    return { error: "Photo not found.", success: null };
  }

  let guide;
  try {
    guide = await assertGuideOwner(guideId);
  } catch {
    return { error: "Guide not found.", success: null };
  }

  const existing = await getPlaceByIdForGuide(placeId, guideId);
  if (!existing) {
    return { error: "Place not found.", success: null };
  }

  const photo = await getAccessiblePhotoById(photoId);
  if (!photo || photo.place_id !== placeId) {
    return { error: "Photo not found.", success: null };
  }

  try {
    await deletePhotoById(photoId);
    try {
      await deletePlacePhotoStorage(photo.storage_path);
    } catch {
      // Storage cleanup is best-effort after the row is gone.
    }

    revalidateGuidePaths(guide.id, guide.slug, guide.isPublic);
    return { error: null, success: "Photo removed." };
  } catch {
    return { error: "Could not remove photo.", success: null };
  }
}

export async function reorderPlacePhotosAction(
  _previousState: PlaceActionState,
  formData: FormData,
): Promise<PlaceActionState> {
  const guideId = readGuideId(formData);
  const placeId = readPlaceId(formData);
  const photoIdsRaw = formData.get("photoIds");
  if (!guideId || !placeId || typeof photoIdsRaw !== "string") {
    return { error: "Could not reorder photos.", success: null };
  }

  let guide;
  try {
    guide = await assertGuideOwner(guideId);
  } catch {
    return { error: "Guide not found.", success: null };
  }

  const existing = await getPlaceByIdForGuide(placeId, guideId);
  if (!existing) {
    return { error: "Place not found.", success: null };
  }

  let photoIds: string[];
  try {
    const parsed = JSON.parse(photoIdsRaw) as unknown;
    if (!Array.isArray(parsed) || !parsed.every((id) => typeof id === "string")) {
      return { error: "Could not reorder photos.", success: null };
    }
    photoIds = parsed;
  } catch {
    return { error: "Could not reorder photos.", success: null };
  }

  const photos = await getPhotosByPlaceIds([placeId]);
  const photoIdSet = new Set(photos.map((row) => row.id));
  if (
    photoIds.length !== photos.length ||
    !photoIds.every((id) => photoIdSet.has(id))
  ) {
    return { error: "Could not reorder photos.", success: null };
  }

  try {
    await updatePhotoSortOrders(
      photoIds.map((id, index) => ({ id, sortOrder: index })),
    );
    revalidateGuidePaths(guide.id, guide.slug, guide.isPublic);
    return { error: null, success: "Photos reordered." };
  } catch {
    return { error: "Could not reorder photos.", success: null };
  }
}
