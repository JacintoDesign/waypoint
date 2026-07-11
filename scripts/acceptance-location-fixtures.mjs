import { createClient } from "@supabase/supabase-js";

const acceptanceUserId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
const acceptanceGuideId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const placeAId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const placeBId = "cccccccc-cccc-cccc-cccc-cccccccccccc";

function toGeographyPoint(lng, lat) {
  return `SRID=4326;POINT(${lng} ${lat})`;
}

export async function seedAcceptanceLocationFixtures() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to seed acceptance fixtures.",
    );
  }

  const serviceClient = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existing } = await serviceClient.auth.admin.getUserById(
    acceptanceUserId,
  );

  if (!existing.user) {
    await serviceClient.auth.admin.createUser({
      id: acceptanceUserId,
      email: "acceptance-test@waypoint.local",
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
      id: placeAId,
      guide_id: acceptanceGuideId,
      name: "Place A",
      address: "123 Main St",
      rating: 4,
      category: "cafe",
      sort_order: 0,
      location: toGeographyPoint(-73.98, 40.75),
    },
    {
      id: placeBId,
      guide_id: acceptanceGuideId,
      name: "Place B",
      address: "456 Oak Ave",
      rating: 5,
      category: "restaurant",
      sort_order: 1,
      location: toGeographyPoint(-118.25, 34.05),
    },
  ]);
}
