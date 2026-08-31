import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchAndImportFromStreamersCenter } from "@/lib/bonusHuntImport";
import { isStreamersCenterApiConfigError } from "@/lib/streamers-center-api";

export const dynamic = "force-dynamic";

// Minimum time between real upstream syncs, shared across all concurrent viewers.
const MIN_INTERVAL_MS = 8000;

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/** Atomically claims the sync lock; returns true only for the single request that wins the race. */
async function claimSyncLock() {
  const db = getServiceRoleClient();
  if (!db) return false;

  const threshold = new Date(Date.now() - MIN_INTERVAL_MS).toISOString();
  const { data, error } = await db
    .from("bonus_hunt_sync_state")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", 1)
    .lt("last_synced_at", threshold)
    .select("id");

  if (error) throw new Error("Erro ao verificar lock de sincronizacao: " + error.message);
  return (data?.length ?? 0) > 0;
}


/**
 * GET /api/bonus-hunt/live — public, unauthenticated poll endpoint.
 * Called frequently by the public bonus-hunt page; at most one caller per
 * MIN_INTERVAL_MS actually reaches the Streamers Center API, the rest are
 * cheap no-ops. Writes go to Supabase, so all viewers get the update via realtime.
 */
export async function GET() {
  let claimed = false;
  try {
    claimed = await claimSyncLock();
  } catch (error) {
    console.error("[bonus-hunt/live] lock error:", error);
    return NextResponse.json({ synced: false });
  }

  if (!claimed) {
    return NextResponse.json({ synced: false, throttled: true });
  }

  try {
    const result = await fetchAndImportFromStreamersCenter();
    return NextResponse.json({ synced: true, phase: result.phase, session_id: result.sessionId });
  } catch (error) {
    if (!isStreamersCenterApiConfigError(error)) {
      console.error("[bonus-hunt/live] sync error:", error);
    }
    return NextResponse.json({ synced: false });
  }
}
