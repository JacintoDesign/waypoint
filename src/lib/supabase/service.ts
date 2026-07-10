import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServiceEnv } from "@/lib/env";
import type { Database } from "@/types/database";

export type SupabaseServiceClient = SupabaseClient<Database>;

export function createSupabaseServiceClient(): SupabaseServiceClient {
  const env = getServiceEnv();
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
