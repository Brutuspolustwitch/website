"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { CasinoOfferRow } from "@/lib/supabase";
import { OfferCard } from "@/components/OfferCard";
import type { CasinoOffer } from "@/components/OfferCard";

/* ═══════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════ */

interface DailySessionData {
  id: string;
  title: string;
  session_date: string;
  casino_id: string | null;
  spotify_url: string | null;
  deposits: number;
  withdrawals: number;
  bonuses_count: number;
  biggest_win: number;
  is_active: boolean;
  casino: CasinoOfferRow | null;
}

/* ═══════════════════════════════════════════════════════════════════
   ANIMATED COUNTER
   ═══════════════════════════════════════════════════════════════════ */

function AnimatedCounter({ value, prefix = "", suffix = "", className = "" }: {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    const duration = 1200;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (end - start) * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
    prevValue.current = end;
  }, [value]);

  return (
    <span className={className}>
      {prefix}{display.toFixed(2)}{suffix}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CORNER ORNAMENT (reused from OfferCard)
   ═══════════════════════════════════════════════════════════════════ */

function CornerOrnament({ className }: { className: string }) {
  return (
    <svg className={`scroll-ornament ${className}`} viewBox="0 0 24 24" fill="none">
      <path
        d="M2 2 L2 10 M2 2 L10 2 M2 6 L6 2"
        stroke="#8b6914"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="4" cy="4" r="1.5" fill="#8b6914" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PAPYRUS STAT PLATE — medieval styled stat card
   ═══════════════════════════════════════════════════════════════════ */

function StatPlate({ label, value, glow }: {
  label: string;
  value: number;
  glow: "green" | "red" | "gold";
}) {
  const valueColor = {
    green: "#2e7d32",
    red: "#8b1a1a",
    gold: "#8b6914",
  };

  return (
    <motion.div
      className="papyrus-scroll greek-key-border"
      style={{ maxWidth: "100%", padding: 0 }}
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="scroll-content" style={{ textAlign: "center", padding: "14px 10px 12px" }}>
        <p style={{
          fontFamily: "var(--font-display)",
          fontSize: "0.55rem",
          fontWeight: 600,
          color: "var(--ink-light)",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          marginBottom: "4px",
        }}>
          {label}
        </p>
        <span style={{
          fontFamily: "var(--font-ui)",
          fontSize: "1.5rem",
          fontWeight: 700,
          color: valueColor[glow],
          letterSpacing: "0.05em",
          textShadow: "0 1px 2px rgba(0,0,0,0.1)",
        }}>
          <AnimatedCounter value={value} suffix="€" />
        </span>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PAPYRUS SPOTIFY CONTAINER
   ═══════════════════════════════════════════════════════════════════ */

function SpotifyEmbed({ url }: { url: string | null }) {
  if (!url) {
    return (
      <div className="papyrus-scroll greek-key-border" style={{ maxWidth: "100%" }}>
        <div className="scroll-content" style={{ textAlign: "center", padding: "32px 16px" }}>
          <svg style={{ width: 40, height: 40, margin: "0 auto 12px", color: "var(--ink-light)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "0.85rem", color: "var(--ink-light)" }}>
            Nenhuma playlist definida para esta sessão
          </p>
        </div>
      </div>
    );
  }

  // Convert spotify URL to embed URL
  let embedUrl = url;
  if (url.includes("open.spotify.com")) {
    embedUrl = url.replace("open.spotify.com/", "open.spotify.com/embed/");
    if (!embedUrl.includes("?")) embedUrl += "?utm_source=generator&theme=0";
  }

  return (
    <motion.div
      className="papyrus-scroll greek-key-border"
      style={{ maxWidth: "100%", overflow: "hidden" }}
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300 }}
    >

      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "12px 16px",
        borderBottom: "1px solid var(--gold-dark)",
        opacity: 0.7,
        background: "linear-gradient(135deg, rgba(139,105,20,0.08), transparent)",
      }}>
        <svg style={{ width: 20, height: 20, color: "#1DB954" }} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
        </svg>
        <span style={{
          fontFamily: "var(--font-display)",
          fontSize: "0.8rem",
          color: "var(--ink-dark)",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
        }}>
          Arena Playlist
        </span>
      </div>

      {/* Embed */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <iframe
          src={embedUrl}
          width="100%"
          height="352"
          frameBorder="0"
          allowFullScreen
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          style={{ display: "block", borderRadius: "0 0 14px 14px" }}
        />
      </div>
    </motion.div>
  );
}

interface MonthlyStats {
  deposits: number;
  withdrawals: number;
  sessions_count: number;
  bonuses_count: number;
  biggest_win: number;
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export default function DailySessionContent() {
  const searchParams = useSearchParams();
  const isOverlay = searchParams.get("overlay") === "true";
  const [session, setSession] = useState<DailySessionData | null>(null);
  const [monthly, setMonthly] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/daily-session");
      const data = await res.json();
      if (data.session) setSession(data.session);
      if (data.monthly) setMonthly(data.monthly);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Realtime subscription for live updates
  useEffect(() => {
    const channel = supabase
      .channel("daily-session-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_sessions" }, (payload) => {
        const updated = payload.new as DailySessionData;
        if (updated?.is_active) {
          // Re-fetch to get joined casino data
          fetchSession();
        } else if (payload.eventType === "UPDATE" && session?.id === (payload.old as { id: string })?.id) {
          fetchSession();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchSession, session?.id]);

  const net = (session?.withdrawals ?? 0) - (session?.deposits ?? 0);
  const netGlow = net > 0 ? "green" : net < 0 ? "red" : "gold";

  /* ── OBS Overlay Mode ──────────────────────────────────── */
  if (isOverlay) {
    return (
      <div className="min-h-screen bg-transparent p-6">
        {session ? (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <StatPlate label="Depósitos" value={session.deposits} glow="red" />
              <StatPlate label="Levantamentos" value={session.withdrawals} glow="green" />
              <StatPlate label="Resultado" value={net} glow={netGlow} />
            </div>
            {/* Casino logo */}
            {session.casino?.logo_url && (
              <div className="flex justify-center">
                <img src={session.casino.logo_url} alt={session.casino.name} className="h-12 object-contain" />
              </div>
            )}
          </div>
        ) : (
          <p className="text-arena-ash text-center">Sem sessão ativa</p>
        )}
      </div>
    );
  }

  /* ── Loading State ─────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-arena-gold/30 border-t-arena-gold rounded-full animate-spin" />
      </div>
    );
  }

  /* ── No Active Session ─────────────────────────────────── */
  if (!session) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-black">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-black" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url('/images/gladiator-portrait.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "brightness(0.2) saturate(0.3) sepia(0.3)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <svg className="w-16 h-16 mx-auto text-arena-gold/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-[family-name:var(--font-display)] text-arena-gold">
              Nenhuma Sessão Ativa
            </h2>
            <p className="text-arena-smoke text-sm max-w-md">
              O gladiador está a preparar-se para a próxima batalha. Volta em breve!
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ── Active Session ────────────────────────────────────── */
  const dateFormatted = new Date(session.session_date + "T00:00:00").toLocaleDateString("pt-PT", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-black" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/images/gladiator-portrait.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.15) saturate(0.3) sepia(0.3) blur(2px)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black" />
        {/* Fog overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-arena-crimson/[0.03] to-transparent pointer-events-none" />
      </div>

      {/* Content */}
      <div className="relative z-10 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

          {/* ── Header ──────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-2"
          >
            <div className="flex items-center justify-center gap-3">
              <h1 className="text-3xl sm:text-5xl font-bold font-[family-name:var(--font-display)] bg-gradient-to-r from-arena-gold via-arena-gold-light to-arena-gold bg-clip-text text-transparent">
                {session.title}
              </h1>
              {/* LIVE indicator */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-900/60 border border-red-500/40 text-xs font-bold text-red-300 uppercase">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                LIVE
              </span>
            </div>
            <p className="text-arena-smoke text-sm capitalize">{dateFormatted}</p>
          </motion.div>

          {/* ── Stats Panel ─────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <StatPlate label="Depósitos" value={session.deposits} glow="red" />
            <StatPlate label="Levantamentos" value={session.withdrawals} glow="green" />
            <StatPlate label="Resultado Líquido" value={net} glow={netGlow} />
          </motion.div>

          {/* Bonus stats (if available) */}
          {(session.bonuses_count > 0 || session.biggest_win > 0) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center gap-6 text-center"
            >
              {session.bonuses_count > 0 && (
                <div className="papyrus-scroll greek-key-border" style={{ maxWidth: "160px", padding: 0 }}>
                  <div className="scroll-content" style={{ textAlign: "center", padding: "10px 16px" }}>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "0.6rem", color: "var(--ink-light)", letterSpacing: "0.15em", textTransform: "uppercase" }}>Bónus Jogados</p>
                    <p style={{ fontFamily: "var(--font-ui)", fontSize: "1.25rem", fontWeight: 700, color: "var(--gold-dark)" }}>{session.bonuses_count}</p>
                  </div>
                </div>
              )}
              {session.biggest_win > 0 && (
                <div className="papyrus-scroll greek-key-border" style={{ maxWidth: "160px", padding: 0 }}>
                  <div className="scroll-content" style={{ textAlign: "center", padding: "10px 16px" }}>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "0.6rem", color: "var(--ink-light)", letterSpacing: "0.15em", textTransform: "uppercase" }}>Maior Vitória</p>
                    <p style={{ fontFamily: "var(--font-ui)", fontSize: "1.25rem", fontWeight: 700, color: "#2e7d32" }}>{session.biggest_win.toFixed(2)}€</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Monthly Summary Card ───────────────── */}
          {monthly && monthly.sessions_count > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex justify-center"
            >
              <div className="papyrus-scroll greek-key-border" style={{ maxWidth: "520px", width: "100%", padding: 0 }}>
                <div className="scroll-content" style={{ padding: "14px 20px 12px" }}>
                  <p style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "0.6rem",
                    fontWeight: 600,
                    color: "var(--ink-light)",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    textAlign: "center",
                    marginBottom: "10px",
                  }}>
                    Resumo do Mês · {monthly.sessions_count} {monthly.sessions_count === 1 ? "sessão" : "sessões"}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-around", gap: "12px", textAlign: "center" }}>
                    <div>
                      <p style={{ fontFamily: "var(--font-display)", fontSize: "0.5rem", color: "var(--ink-light)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "2px" }}>Depósitos</p>
                      <p style={{ fontFamily: "var(--font-ui)", fontSize: "1.1rem", fontWeight: 700, color: "#8b1a1a" }}>{monthly.deposits.toFixed(2)}€</p>
                    </div>
                    <div>
                      <p style={{ fontFamily: "var(--font-display)", fontSize: "0.5rem", color: "var(--ink-light)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "2px" }}>Levantamentos</p>
                      <p style={{ fontFamily: "var(--font-ui)", fontSize: "1.1rem", fontWeight: 700, color: "#2e7d32" }}>{monthly.withdrawals.toFixed(2)}€</p>
                    </div>
                    <div>
                      <p style={{ fontFamily: "var(--font-display)", fontSize: "0.5rem", color: "var(--ink-light)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "2px" }}>Resultado</p>
                      <p style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: "1.1rem",
                        fontWeight: 700,
                        color: (monthly.withdrawals - monthly.deposits) >= 0 ? "#2e7d32" : "#8b1a1a",
                      }}>
                        {(monthly.withdrawals - monthly.deposits).toFixed(2)}€
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── 2-Column Layout ─────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 justify-items-center"
          >
            {/* LEFT: Casino Card — reuses the papyrus OfferCard */}
            <div>
              {session.casino ? (
                <OfferCard offer={{
                  slug: session.casino.slug,
                  name: session.casino.name,
                  logo_url: session.casino.logo_url ?? undefined,
                  logo_bg: session.casino.logo_bg,
                  banner_url: session.casino.banner_url ?? undefined,
                  badge: session.casino.badge ?? undefined,
                  tags: session.casino.tags,
                  headline: session.casino.headline,
                  bonus_value: session.casino.bonus_value,
                  free_spins: session.casino.free_spins,
                  min_deposit: session.casino.min_deposit,
                  code: session.casino.code,
                  cashback: session.casino.cashback ?? undefined,
                  withdraw_time: session.casino.withdraw_time,
                  license: session.casino.license,
                  established: session.casino.established,
                  notes: session.casino.notes,
                  affiliate_url: session.casino.affiliate_url,
                  rating: session.casino.rating ?? 4.5,
                }} />
              ) : (
                <div className="papyrus-scroll greek-key-border papyrus-scroll-top papyrus-scroll-bottom" style={{ maxWidth: "400px" }}>
                  <div className="scroll-content" style={{ textAlign: "center", padding: "32px 16px" }}>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "0.85rem", color: "var(--ink-light)" }}>Nenhum casino selecionado</p>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Spotify */}
            <div>
              <SpotifyEmbed url={session.spotify_url} />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
