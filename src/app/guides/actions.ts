"use server";

import { redirect } from "next/navigation";
import { requireAuthor } from "@/lib/auth";
import { uploadGuideCoverPhoto, validateCoverImageFile } from "@/lib/guide-covers";
import { createGuide, updateGuideCoverPhoto } from "@/queries/guides";
import { ensureUserProfile } from "@/queries/users";

export type CreateGuideState = {
  error: string | null;
};

export async function createGuideAction(
  _previousState: CreateGuideState,
  formData: FormData,
): Promise<CreateGuideState> {
  const user = await requireAuthor();
  await ensureUserProfile(user);

  const title = formData.get("title");
  if (typeof title !== "string" || title.trim() === "") {
    return { error: "Title is required." };
  }

  const description = formData.get("description");
  const coverPhoto = formData.get("coverPhoto");

  if (coverPhoto instanceof File && coverPhoto.size > 0) {
    const validationError = validateCoverImageFile(coverPhoto);
    if (validationError) {
      return { error: validationError };
    }
  }

  let guide;
  try {
    guide = await createGuide({
      userId: user.id,
      title: title.trim(),
      description:
        typeof description === "string" && description.trim()
          ? description.trim()
          : null,
    });
  } catch {
    return { error: "Could not create guide. Please try again." };
  }

  if (coverPhoto instanceof File && coverPhoto.size > 0) {
    try {
      const storagePath = await uploadGuideCoverPhoto(guide.id, coverPhoto);
      await updateGuideCoverPhoto(guide.id, user.id, storagePath);
    } catch {
      redirect(`/guides/${guide.id}?coverError=1`);
    }
  }

  redirect(`/guides/${guide.id}`);
}
