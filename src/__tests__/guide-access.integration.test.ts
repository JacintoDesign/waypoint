import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/types/database";

function loadEnvFile(path: string): void {
  if (!existsSync(path)) {
    return;
  }

  const contents = readFileSync(path, "utf8");
  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(join(process.cwd(), ".env"));

const hasIntegrationEnv =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

const ownerUserId = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";
const otherUserId = "ffffffff-ffff-ffff-ffff-ffffffffffff";
const privateGuideId = "11111111-1111-1111-1111-111111111111";
const publicGuideId = "22222222-2222-2222-2222-222222222222";
const privateSlug = "access-test-private-guide";
const publicSlug = "access-test-public-guide";

describe.skipIf(!hasIntegrationEnv)("guide access rules (integration)", () => {
  let serviceClient: ReturnType<typeof createClient<Database>>;
  let anonClient: ReturnType<typeof createClient<Database>>;

  beforeAll(async () => {
    serviceClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    anonClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    for (const user of [
      { id: ownerUserId, email: "guide-access-owner@waypoint.local", handle: "guide_access_owner" },
      { id: otherUserId, email: "guide-access-other@waypoint.local", handle: "guide_access_other" },
    ]) {
      const { data: existing } = await serviceClient.auth.admin.getUserById(user.id);
      if (!existing.user) {
        await serviceClient.auth.admin.createUser({
          id: user.id,
          email: user.email,
          email_confirm: true,
          password: "test-password-123",
        });
      }

      await serviceClient.from("users").upsert({
        id: user.id,
        handle: user.handle,
        display_name: user.handle,
      });
    }

    await serviceClient.from("guides").upsert([
      {
        id: privateGuideId,
        user_id: ownerUserId,
        title: "Access Test Private Guide",
        is_public: false,
        slug: privateSlug,
      },
      {
        id: publicGuideId,
        user_id: ownerUserId,
        title: "Access Test Public Guide",
        is_public: true,
        slug: publicSlug,
      },
    ]);
  });

  afterAll(async () => {
    if (!hasIntegrationEnv) {
      return;
    }

    await serviceClient.from("guides").delete().in("id", [privateGuideId, publicGuideId]);
  });

  it("a logged-out visitor cannot read a private guide", async () => {
    const { data, error } = await anonClient
      .from("guides")
      .select("id")
      .eq("slug", privateSlug)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it("a logged-out visitor can read a public guide by its link", async () => {
    const { data, error } = await anonClient
      .from("guides")
      .select("id, slug, is_public")
      .eq("slug", publicSlug)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data).toMatchObject({ id: publicGuideId, slug: publicSlug, is_public: true });
  });

  it("a user cannot edit a guide they do not own", async () => {
    const { data: signInData, error: signInError } =
      await anonClient.auth.signInWithPassword({
        email: "guide-access-other@waypoint.local",
        password: "test-password-123",
      });

    expect(signInError).toBeNull();
    expect(signInData.user?.id).toBe(otherUserId);

    const { data, error } = await anonClient
      .from("guides")
      .update({ title: "Hijacked" })
      .eq("id", privateGuideId)
      .select("id");

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});
