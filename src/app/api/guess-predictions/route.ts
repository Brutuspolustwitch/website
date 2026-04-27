import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

function getSession(raw: string): { id: string; login: string; display_name: string; role?: string } | null {
  try { return JSON.parse(raw); } catch { return null; }
}

/** GET /api/guess-predictions?huntSessionId=xxx */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const huntSessionId = url.searchParams.get("huntSessionId");

  if (!huntSessionId) {
    return NextResponse.json({ error: "huntSessionId required" }, { status: 400 });
  }

  const { data: guessSession } = await supabase
    .from("guess_sessions")
    .select("*")
    .eq("bonus_hunt_session_id", huntSessionId)
    .single();

  if (!guessSession) {
    return NextResponse.json({ guessSession: null, myPrediction: null, predictions: [], totalCount: 0 });
  }

  const cookieStore = await cookies();
  const raw = cookieStore.get("twitch_session")?.value;
  let myPrediction = null;
  let isAdmin = false;

  if (raw) {
    const session = getSession(raw);
    if (session) {
      const { data: user } = await supabase
        .from("users")
        .select("id, role")
        .eq("twitch_id", session.id)
        .single();

      if (user) {
        isAdmin = ["admin", "configurador"].includes(user.role);
        const { data: pred } = await supabase
          .from("guess_predictions")
          .select("*")
          .eq("guess_session_id", guessSession.id)
          .eq("user_id", user.id)
          .single();
        myPrediction = pred ?? null;
      }
    }
  }

  const { count: totalCount } = await supabase
    .from("guess_predictions")
    .select("*", { count: "exact", head: true })
    .eq("guess_session_id", guessSession.id);

  // Return full predictions only after resolve or to admins
  let predictions: Record<string, unknown>[] = [];
  if (guessSession.status === "resolved" || isAdmin) {
    const { data } = await supabase
      .from("guess_predictions")
      .select("*")
      .eq("guess_session_id", guessSession.id)
      .order("created_at", { ascending: true });
    predictions = data ?? [];

    if (guessSession.status === "resolved" && guessSession.final_payout != null) {
      predictions = predictions.sort((a, b) =>
        Math.abs((a.predicted_amount as number) - guessSession.final_payout) -
        Math.abs((b.predicted_amount as number) - guessSession.final_payout)
      );
    }
  }

  return NextResponse.json({ guessSession, myPrediction, predictions, totalCount: totalCount ?? 0 });
}

/** POST /api/guess-predictions — submit or update a prediction */
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const raw = cookieStore.get("twitch_session")?.value;
  if (!raw) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const session = getSession(raw);
  if (!session) return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });

  const body = await request.json();
  const { huntSessionId, predictedAmount } = body;

  if (!huntSessionId || predictedAmount == null) {
    return NextResponse.json({ error: "huntSessionId e predictedAmount obrigatórios" }, { status: 400 });
  }

  const amount = parseFloat(predictedAmount);
  if (isNaN(amount) || amount <= 0 || amount > 9999999) {
    return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
  }

  const { data: guessSession } = await supabase
    .from("guess_sessions")
    .select("id, betting_open, status")
    .eq("bonus_hunt_session_id", huntSessionId)
    .single();

  if (!guessSession) return NextResponse.json({ error: "Sessão de apostas não encontrada" }, { status: 404 });
  if (!guessSession.betting_open || guessSession.status !== "open") {
    return NextResponse.json({ error: "Apostas fechadas" }, { status: 403 });
  }

  const { data: user } = await supabase
    .from("users")
    .select("id, display_name")
    .eq("twitch_id", session.id)
    .single();

  if (!user) return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });

  // Enforce single bet per user per session
  const { data: existing } = await supabase
    .from("guess_predictions")
    .select("id")
    .eq("guess_session_id", guessSession.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Já apostaste nesta sessão. Só é permitida uma aposta." },
      { status: 409 }
    );
  }

  const { data: prediction, error } = await supabase
    .from("guess_predictions")
    .insert({
      guess_session_id: guessSession.id,
      user_id: user.id,
      display_name: user.display_name,
      predicted_amount: amount,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Reward 20 points for placing a bet
  await supabase.rpc("increment_user_points", { p_user_id: user.id, p_amount: 20 });

  return NextResponse.json({ prediction });
}

/** PATCH /api/guess-predictions — admin actions */
export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const raw = cookieStore.get("twitch_session")?.value;
  if (!raw) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const session = getSession(raw);
  if (!session) return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });

  const { data: admin } = await supabase
    .from("users")
    .select("role")
    .eq("twitch_id", session.id)
    .single();

  if (!admin || !["admin", "configurador", "moderador"].includes(admin.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await request.json();
  const { action, huntSessionId, guessSessionId, finalPayout } = body;

  // moderador may only create or toggle betting; lock/resolve are admin/configurador only
  const isPrivileged = ["admin", "configurador"].includes(admin.role);
  if (!isPrivileged && !["create", "toggle_betting"].includes(action)) {
    return NextResponse.json({ error: "Sem permissão para esta acção" }, { status: 403 });
  }

  if (action === "create") {
    const { data, error } = await supabase
      .from("guess_sessions")
      .insert({ bonus_hunt_session_id: huntSessionId, betting_open: false, status: "open" })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ guessSession: data });
  }

  if (action === "toggle_betting") {
    const { data: current } = await supabase
      .from("guess_sessions")
      .select("betting_open")
      .eq("id", guessSessionId)
      .single();

    const { data, error } = await supabase
      .from("guess_sessions")
      .update({ betting_open: !current?.betting_open })
      .eq("id", guessSessionId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ guessSession: data });
  }

  if (action === "lock") {
    const { data, error } = await supabase
      .from("guess_sessions")
      .update({ betting_open: false, status: "locked" })
      .eq("id", guessSessionId)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ guessSession: data });
  }

  if (action === "resolve") {
    const payout = parseFloat(finalPayout);
    if (isNaN(payout) || payout < 0) {
      return NextResponse.json({ error: "finalPayout inválido" }, { status: 400 });
    }

    const { data: predictions } = await supabase
      .from("guess_predictions")
      .select("*")
      .eq("guess_session_id", guessSessionId)
      .order("created_at", { ascending: true }); // tie-break: earliest guess wins

    const baseUpdate = {
      betting_open: false,
      status: "resolved",
      final_payout: payout,
      resolved_at: new Date().toISOString(),
    };

    if (!predictions || predictions.length === 0) {
      const { data, error } = await supabase
        .from("guess_sessions")
        .update(baseUpdate)
        .eq("id", guessSessionId)
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ guessSession: data, winner: null });
    }

    // Price-Is-Right rule: winner is the closest prediction AT OR ABOVE the payout.
    // If nobody bet >= payout, there is no winner.
    const eligible = predictions.filter(
      (p) => (p.predicted_amount as number) >= payout
    );

    if (eligible.length === 0) {
      const { data, error } = await supabase
        .from("guess_sessions")
        .update(baseUpdate)
        .eq("id", guessSessionId)
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ guessSession: data, winner: null });
    }

    // Smallest amount above the payout wins; tie-break: earliest guess.
    const winner = eligible.reduce((best, p) => {
      const bestAmt = best.predicted_amount as number;
      const pAmt = p.predicted_amount as number;
      if (pAmt < bestAmt) return p;
      if (pAmt === bestAmt) {
        return new Date(p.created_at as string) < new Date(best.created_at as string) ? p : best;
      }
      return best;
    });

    const { data, error } = await supabase
      .from("guess_sessions")
      .update({
        ...baseUpdate,
        winner_user_id: winner.user_id,
        winner_display_name: winner.display_name,
        winner_predicted_amount: winner.predicted_amount,
        winner_diff: Math.abs((winner.predicted_amount as number) - payout),
      })
      .eq("id", guessSessionId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ guessSession: data, winner });
  }

  return NextResponse.json({ error: "action inválida" }, { status: 400 });
}
