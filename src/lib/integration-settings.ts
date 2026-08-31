import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// integration_settings has RLS enabled with no policies — only the service-role
// client (used exclusively server-side) can read/write it. Created lazily so
// builds/pages that never call this don't crash when the key isn't set.
let cachedClient: SupabaseClient | null = null;
function db() {
  if (cachedClient) return cachedClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  cachedClient = createClient(url, key);
  return cachedClient;
}

/** Reads a server-only setting stored in the database. Returns null if unset or unavailable. */
export async function getIntegrationSetting(key: string): Promise<string | null> {
  const client = db();
  if (!client) return null;
  const { data, error } = await client
    .from("integration_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error || !data) return null;
  return data.value;
}

export async function setIntegrationSetting(key: string, value: string) {
  const client = db();
  if (!client) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY (and NEXT_PUBLIC_SUPABASE_URL) are required to save integration settings."
    );
  }
  const { error } = await client
    .from("integration_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

export async function deleteIntegrationSetting(key: string) {
  const client = db();
  if (!client) return;
  await client.from("integration_settings").delete().eq("key", key);
}
