import {
  PLACE_PHOTOS_BUCKET,
  SIGNED_URL_TTL_SECONDS,
  signedUrlExpiresAt,
} from "@/lib/place-photos";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { PhotoRow, SignedPlacePhoto } from "@/types/photo";

function mapRowToSignedPhoto(
  row: PhotoRow,
  url: string,
  expiresAt: number,
): SignedPlacePhoto {
  return {
    id: row.id,
    placeId: row.place_id,
    caption: row.caption,
    sortOrder: row.sort_order,
    url,
    expiresAt,
  };
}

async function signStoragePaths(
  storagePaths: string[],
): Promise<Map<string, string>> {
  if (storagePaths.length === 0) {
    return new Map();
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.storage
    .from(PLACE_PHOTOS_BUCKET)
    .createSignedUrls(storagePaths, SIGNED_URL_TTL_SECONDS);

  if (error) {
    throw error;
  }

  const signedUrls = new Map<string, string>();

  for (const item of data ?? []) {
    if (item.path && item.signedUrl) {
      signedUrls.set(item.path, item.signedUrl);
    }
  }

  return signedUrls;
}

export async function getPhotosByPlaceIds(
  placeIds: string[],
): Promise<PhotoRow[]> {
  if (placeIds.length === 0) {
    return [];
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("photos")
    .select("id, place_id, storage_path, caption, sort_order")
    .in("place_id", placeIds)
    .order("sort_order")
    .order("id");

  if (error) {
    throw error;
  }

  return (data ?? []) as PhotoRow[];
}

export async function getSignedPhotosByPlaceIds(
  placeIds: string[],
): Promise<SignedPlacePhoto[]> {
  const rows = await getPhotosByPlaceIds(placeIds);
  if (rows.length === 0) {
    return [];
  }

  const signedUrls = await signStoragePaths(
    rows.map((row) => row.storage_path),
  );
  const expiresAt = signedUrlExpiresAt();

  return rows.flatMap((row) => {
    const url = signedUrls.get(row.storage_path);
    if (!url) {
      return [];
    }

    return [mapRowToSignedPhoto(row, url, expiresAt)];
  });
}

export async function getPrimarySignedPhotosByPlaceIds(
  placeIds: string[],
): Promise<Map<string, SignedPlacePhoto>> {
  const photos = await getSignedPhotosByPlaceIds(placeIds);
  const primaryByPlaceId = new Map<string, SignedPlacePhoto>();

  for (const photo of photos) {
    if (!primaryByPlaceId.has(photo.placeId)) {
      primaryByPlaceId.set(photo.placeId, photo);
    }
  }

  return primaryByPlaceId;
}

export async function getAccessiblePhotoById(
  photoId: string,
): Promise<PhotoRow | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("photos")
    .select("id, place_id, storage_path, caption, sort_order")
    .eq("id", photoId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? (data as PhotoRow) : null;
}

export async function getSignedPhotoById(
  photoId: string,
): Promise<SignedPlacePhoto | null> {
  const row = await getAccessiblePhotoById(photoId);
  if (!row) {
    return null;
  }

  const signedUrls = await signStoragePaths([row.storage_path]);
  const url = signedUrls.get(row.storage_path);
  if (!url) {
    return null;
  }

  return mapRowToSignedPhoto(row, url, signedUrlExpiresAt());
}
