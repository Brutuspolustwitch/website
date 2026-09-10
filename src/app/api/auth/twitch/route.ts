import { NextResponse } from "next/server";
import crypto from "crypto";
import { getRequestOrigin } from "@/lib/request-origin";

export const dynamic = "force-dynamic";

const isProduction = process.env.NODE_ENV === "production";

export async function GET(request: Request) {
  const clientId = process.env.TWITCH_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: "TWITCH_CLIENT_ID not configured" },
      { status: 500 }
    );
  }

  const origin = getRequestOrigin(request);
  const redirectUri = `${origin}/api/auth/twitch/callback`;
  const state = crypto.randomBytes(16).toString("hex");
  const scopes = ["user:read:email"].join(" ");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    state,
    force_verify: "true",
  });

  const response = NextResponse.redirect(
    `https://id.twitch.tv/oauth2/authorize?${params.toString()}`,
  );

  response.cookies.set("twitch_oauth_state", state, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 300,
    path: "/",
  });
  response.cookies.set("twitch_session", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  response.cookies.set("twitch_user", "", {
    httpOnly: false,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
