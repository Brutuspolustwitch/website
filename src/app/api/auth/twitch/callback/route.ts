import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import type { UserRole } from "@/lib/supabase";
import { getRequestOrigin } from "@/lib/request-origin";

export const dynamic = "force-dynamic";

const isProduction = process.env.NODE_ENV === "production";
const sessionMaxAge = 60 * 60 * 24 * 7;

type TwitchUser = {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
  email?: string | null;
};

function clearOauthState(response: NextResponse) {
  response.cookies.set("twitch_oauth_state", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

function redirectHome(origin: string, error?: string) {
  const url = new URL("/", origin);
  if (error) url.searchParams.set("auth_error", error);
  const response = NextResponse.redirect(url);
  clearOauthState(response);
  return response;
}

async function resolveUserRole(twitchId: string): Promise<UserRole> {
  const { data, error } = await supabase
    .from("users")
    .select("role, role_expires_at")
    .eq("twitch_id", twitchId)
    .maybeSingle();

  if (error) {
    console.error("Twitch login role lookup failed:", error.message);
    return "viewer";
  }

  const role = (data?.role ?? "viewer") as UserRole;
  if (data?.role_expires_at && new Date(data.role_expires_at) < new Date()) {
    return "viewer";
  }

  return role;
}

async function syncUserProfile(user: TwitchUser, role: UserRole, clientIp: string | null) {
  const { data: existingUser, error: lookupError } = await supabase
    .from("users")
    .select("twitch_id")
    .eq("twitch_id", user.id)
    .maybeSingle();

  if (lookupError) {
    throw lookupError;
  }

  if (existingUser) {
    const { error } = await supabase
      .from("users")
      .update({
        login: user.login,
        display_name: user.display_name,
        profile_image_url: user.profile_image_url,
        email: user.email || null,
        ip_address: clientIp,
        role,
        ...(role === "viewer" ? { role_expires_at: null } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("twitch_id", user.id);

    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("users").insert({
    twitch_id: user.id,
    login: user.login,
    display_name: user.display_name,
    profile_image_url: user.profile_image_url,
    email: user.email || null,
    ip_address: clientIp,
    role: "viewer",
  });

  if (error) throw error;
}

export async function GET(request: Request) {
  const origin = getRequestOrigin(request);
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const cookieStore = await cookies();
  const storedState = cookieStore.get("twitch_oauth_state")?.value;

  // User denied or error
  if (error) {
    return redirectHome(origin, error);
  }

  // Validate CSRF state
  if (!state || !storedState || state !== storedState) {
    return redirectHome(origin, "invalid_state");
  }

  if (!code) {
    return redirectHome(origin, "no_code");
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return redirectHome(origin, "not_configured");
  }

  const redirectUri = `${origin}/api/auth/twitch/callback`;

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      return redirectHome(origin, "token_failed");
    }

    const tokenData = await tokenRes.json();
    const accessToken: string = tokenData.access_token;

    // Fetch user profile from Twitch
    const userRes = await fetch("https://api.twitch.tv/helix/users", {
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userRes.ok) {
      return redirectHome(origin, "user_fetch_failed");
    }

    const userData = await userRes.json();
    const user = userData.data?.[0] as TwitchUser | undefined;

    if (!user) {
      return redirectHome(origin, "no_user");
    }

    // Upsert user into Supabase users table
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || null;
    const role = await resolveUserRole(user.id);

    // Build session payload (stored in httpOnly cookie)
    const session = {
      id: user.id,
      login: user.login,
      display_name: user.display_name,
      profile_image_url: user.profile_image_url,
      email: user.email || null,
      role,
      created_at: new Date().toISOString(),
    };

    const response = NextResponse.redirect(`${origin}/`);
    clearOauthState(response);

    // Set session cookie (JSON-encoded, httpOnly, secure)
    response.cookies.set("twitch_session", JSON.stringify(session), {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: sessionMaxAge,
      path: "/",
    });

    // Set a client-readable cookie with minimal info for the UI
    response.cookies.set(
      "twitch_user",
      JSON.stringify({
        id: user.id,
        login: user.login,
        display_name: user.display_name,
        profile_image_url: user.profile_image_url,
        role,
      }),
      {
        httpOnly: false,
        secure: isProduction,
        sameSite: "lax",
        maxAge: sessionMaxAge,
        path: "/",
      }
    );

    await syncUserProfile(user, role, clientIp).catch((syncError: unknown) => {
      console.error(
        "Twitch login profile sync failed:",
        syncError instanceof Error ? syncError.message : syncError,
      );
    });

    return response;
  } catch {
    return redirectHome(origin, "unexpected");
  }
}
