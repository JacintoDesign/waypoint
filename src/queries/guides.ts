import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Guide, GuideRow } from "@/types/guide";

function mapRowToGuide(row: GuideRow): Guide {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    coverPhotoUrl: row.cover_photo_url,
    isPublic: row.is_public,
    slug: row.slug,
  };
}

export async function getPublicGuideBySlug(slug: string): Promise<Guide | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("guides")
    .select(
      "id, user_id, title, description, cover_photo_url, is_public, slug",
    )
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapRowToGuide(data as GuideRow) : null;
}

export async function getGuidesByUserId(userId: string): Promise<Guide[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("guides")
    .select(
      "id, user_id, title, description, cover_photo_url, is_public, slug",
    )
    .eq("user_id", userId)
    .order("title");

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapRowToGuide(row as GuideRow));
}

export async function getGuideByIdForUser(
  guideId: string,
  userId: string,
): Promise<Guide | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("guides")
    .select(
      "id, user_id, title, description, cover_photo_url, is_public, slug",
    )
    .eq("id", guideId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapRowToGuide(data as GuideRow) : null;
}

export type CreateGuideInput = {
  userId: string;
  title: string;
  description?: string | null;
  coverPhotoUrl?: string | null;
};

export async function createGuide(input: CreateGuideInput): Promise<Guide> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("guides")
    .insert({
      user_id: input.userId,
      title: input.title,
      description: input.description ?? null,
      cover_photo_url: input.coverPhotoUrl ?? null,
      slug: "pending",
    })
    .select(
      "id, user_id, title, description, cover_photo_url, is_public, slug",
    )
    .single();

  if (error) {
    throw error;
  }

  return mapRowToGuide(data as GuideRow);
}

export async function updateGuideCoverPhoto(
  guideId: string,
  userId: string,
  coverPhotoUrl: string | null,
): Promise<Guide> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("guides")
    .update({ cover_photo_url: coverPhotoUrl })
    .eq("id", guideId)
    .eq("user_id", userId)
    .select(
      "id, user_id, title, description, cover_photo_url, is_public, slug",
    )
    .single();

  if (error) {
    throw error;
  }

  return mapRowToGuide(data as GuideRow);
}
