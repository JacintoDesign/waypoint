import { PLACE_PHOTOS_BUCKET, validateImageFile } from "@/lib/place-photos";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

function extensionForMime(type: string): string {
  switch (type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

export function validatePlaceImageFile(file: File): string | null {
  return validateImageFile(file, "Photo");
}

export async function uploadPlacePhoto(
  guideId: string,
  placeId: string,
  file: File,
): Promise<string> {
  const validationError = validatePlaceImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const supabase = createSupabaseServiceClient();
  const extension = extensionForMime(file.type);
  const storagePath = `${guideId}/${placeId}/${crypto.randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(PLACE_PHOTOS_BUCKET)
    .upload(storagePath, bytes, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return storagePath;
}

export async function deletePlacePhotoStorage(
  storagePath: string,
): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.storage
    .from(PLACE_PHOTOS_BUCKET)
    .remove([storagePath]);

  if (error) {
    throw error;
  }
}
