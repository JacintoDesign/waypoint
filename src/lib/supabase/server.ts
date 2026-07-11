import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getEnv } from "@/lib/env";
import type { Database } from "@/types/database";

export type SupabaseServerClient = SupabaseClient<Database>;

export async function createSupabaseServerClient(): Promise<SupabaseServerClient> {
  const cookieStore = await cookies();
  const env = getEnv();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot always set cookies; middleware refreshes sessions.
          }
        },
      },
    },
  ) as unknown as SupabaseServerClient;
}
