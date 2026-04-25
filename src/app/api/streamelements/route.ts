import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SE_API = "https://api.streamelements.com/kappa/v2";

const STAFF_ROLES = ["admin", "configurador", "moderador"] as const;

function getStaffSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function getStaffLogins(): Promise<Set<string>> {
  const sb = getStaffSupabase();
  if (!sb) return new Set();
  const { data } = await sb
    .from("users")
    .select("login")
    .in("role", STAFF_ROLES as unknown as string[]);
  return new Set((data ?? []).map((u: { login: string }) => u.login.toLowerCase()));
}

function getHeaders() {
  const token = process.env.STREAMELEMENTS_JWT_TOKEN;
  if (!token) return null;
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function getChannelId() {
  return process.env.STREAMELEMENTS_CHANNEL_ID || "";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get("endpoint");

  const headers = getHeaders();
  const channelId = getChannelId();

  if (!headers || !channelId) {
    return NextResponse.json(
      { error: "StreamElements not configured" },
      { status: 503 }
    );
  }

  try {
    switch (endpoint) {
      case "leaderboard": {
        // Pull a larger pool so we still have enough after filtering staff out.
        const res = await fetch(
          `${SE_API}/points/${channelId}/top?limit=200`,
          { headers, next: { revalidate: 60 } }
        );
        if (!res.ok) throw new Error(`SE API ${res.status}`);
        const data = await res.json();

        const staff = await getStaffLogins();
        const rawUsers: Array<{ username: string; points: number; rank?: number }> =
          Array.isArray(data?.users) ? data.users : [];

        const filtered = rawUsers
          .filter((u) => u.username && !staff.has(u.username.toLowerCase()))
          .slice(0, 50)
          .map((u, i) => ({ ...u, rank: i + 1 }));

        return NextResponse.json({ ...data, users: filtered });
      }

      case "tips": {
        const res = await fetch(
          `${SE_API}/tips/${channelId}?sort=createdAt&limit=30`,
          { headers, next: { revalidate: 30 } }
        );
        if (!res.ok) throw new Error(`SE API ${res.status}`);
        const data = await res.json();
        return NextResponse.json(data);
      }

      case "activities": {
        const res = await fetch(
          `${SE_API}/activities/${channelId}?limit=30&types=follow,subscriber,cheer,tip`,
          { headers, next: { revalidate: 15 } }
        );
        if (!res.ok) throw new Error(`SE API ${res.status}`);
        const data = await res.json();
        return NextResponse.json(data);
      }

      case "store": {
        const res = await fetch(
          `${SE_API}/store/${channelId}/items?source=loyalty`,
          { headers, next: { revalidate: 120 } }
        );
        if (!res.ok) throw new Error(`SE API ${res.status}`);
        const data = await res.json();
        return NextResponse.json(data);
      }

      case "channel": {
        return NextResponse.json({ channelId });
      }

      case "user-points": {
        const username = searchParams.get("username");
        if (!username) return NextResponse.json({ error: "username required" }, { status: 400 });
        const res = await fetch(
          `${SE_API}/points/${channelId}/${encodeURIComponent(username)}`,
          { headers, next: { revalidate: 10 } }
        );
        if (!res.ok) throw new Error(`SE API ${res.status}`);
        const data = await res.json();
        return NextResponse.json(data);
      }

      default:
        return NextResponse.json(
          { error: "Invalid endpoint. Use: leaderboard, tips, activities, store, channel" },
          { status: 400 }
        );
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch from StreamElements" },
      { status: 502 }
    );
  }
}

export async function PUT(request: Request) {
  const headers = getHeaders();
  const channelId = getChannelId();

  if (!headers || !channelId) {
    return NextResponse.json({ error: "StreamElements not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { username, amount } = body;

    if (!username || amount === undefined) {
      return NextResponse.json({ error: "username and amount required" }, { status: 400 });
    }

    // SE API: PUT /points/{channel}/{user}/{amount} — negative amount deducts, positive adds
    const res = await fetch(
      `${SE_API}/points/${channelId}/${encodeURIComponent(username)}/${amount}`,
      { method: "PUT", headers }
    );

    if (!res.ok) {
      let detail = "";
      try { detail = await res.text(); } catch { /* ignore */ }
      console.error(`SE API PUT failed: ${res.status} ${res.statusText}`, detail);
      return NextResponse.json({ error: `SE API error ${res.status}`, detail }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("updatePoints exception:", err);
    return NextResponse.json({ error: "Failed to update points", detail: String(err) }, { status: 502 });
  }
}
