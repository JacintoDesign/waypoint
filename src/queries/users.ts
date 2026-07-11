import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function baseHandleFromUser(user: User): string {
  const fromEmail = user.email?.split("@")[0] ?? "author";
  const normalized = fromEmail
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);

  return normalized || "author";
}

function displayNameFromUser(user: User): string {
  const metadataName = user.user_metadata?.display_name;
  if (typeof metadataName === "string" && metadataName.trim()) {
    return metadataName.trim();
  }

  const fromEmail = user.email?.split("@")[0];
  if (fromEmail) {
    return fromEmail;
  }

  return "Author";
}

export async function ensureUserProfile(user: User): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data: existing, error: selectError } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    throw selectError;
  }

  if (existing) {
    return;
  }

  const displayName = displayNameFromUser(user);
  const baseHandle = baseHandleFromUser(user);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const handle =
      attempt === 0 ? baseHandle : `${baseHandle}_${attempt + 1}`.slice(0, 30);

    const { error: insertError } = await supabase.from("users").insert({
      id: user.id,
      handle,
      display_name: displayName,
    });

    if (!insertError) {
      return;
    }

    if (insertError.code !== "23505") {
      throw insertError;
    }
  }

  throw new Error("Could not create author profile.");
}
