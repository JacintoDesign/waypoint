import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { toGeographyPoint } from "@/lib/geography";
import {
  placeA,
  placeB,
} from "@/__tests__/fixtures/places";
import type { Database } from "@/types/database";

export const acceptanceUserId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
export const acceptanceGuideId = placeA.guideId;
const acceptanceEmail = "acceptance-test@waypoint.local";

export function createAcceptanceServiceClient(): SupabaseClient<Database> {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function seedAcceptanceLocationFixtures(
  serviceClient: SupabaseClient<Database>,
): Promise<void> {
  const { data: existing } = await serviceClient.auth.admin.getUserById(
    acceptanceUserId,
  );

  if (!existing.user) {
    await serviceClient.auth.admin.createUser({
      id: acceptanceUserId,
      email: acceptanceEmail,
      email_confirm: true,
      password: "test-password-123",
    });
  }

  await serviceClient.from("users").upsert({
    id: acceptanceUserId,
    handle: "acceptance_test",
    display_name: "Acceptance Test",
  });

  await serviceClient.from("guides").upsert({
    id: acceptanceGuideId,
    user_id: acceptanceUserId,
    title: "Acceptance Test Guide",
    is_public: true,
    slug: "acceptance-test-guide",
  });

  await serviceClient.from("places").upsert([
    {
      id: placeA.id,
      guide_id: acceptanceGuideId,
      name: placeA.name,
      address: placeA.address,
      rating: placeA.rating,
      category: placeA.category,
      sort_order: placeA.sortOrder,
      location: toGeographyPoint(placeA.location),
    },
    {
      id: placeB.id,
      guide_id: acceptanceGuideId,
      name: placeB.name,
      address: placeB.address,
      rating: placeB.rating,
      category: placeB.category,
      sort_order: placeB.sortOrder,
      location: toGeographyPoint(placeB.location),
    },
  ]);
}

export async function cleanupAcceptanceLocationFixtures(
  serviceClient: SupabaseClient<Database>,
): Promise<void> {
  await serviceClient
    .from("places")
    .delete()
    .in("id", [placeA.id, placeB.id]);
  await serviceClient.from("guides").delete().eq("id", acceptanceGuideId);
}
