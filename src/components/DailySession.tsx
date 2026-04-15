"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { CasinoOfferRow } from "@/lib/supabase";

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
   STAT PLATE
   ═══════════════════════════════════════════════════════════════════ */

function StatPlate({ label, value, glow }: {
  label: string;
  value: number;
  glow: "green" | "red" | "gold";
}) {
  const glowStyles = {
    green: "shadow-[0_0_30px_rgba(34,197,94,0.25)] border-green-500/30",
    red: "shadow-[0_0_30px_rgba(239,68,68,0.25)] border-red-500/30",
    gold: "shadow-[0_0_30px_rgba(212,168,67,0.2)] border-arena-gold/30",
  };

  const textColor = {
    green: "text-green-400",
    red: "text-red-400",
    gold: "text-arena-gold",
  };

  return (
    <motion.div
      className={`relative bg-gradient-to-b from-arena-iron/80 to-arena-dark/90 rounded-lg border ${glowStyles[glow]} p-4 sm:p-6 text-center overflow-hidden`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {/* Engraved texture */}
      <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iI2ZmZiIgb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] pointer-events-none" />
      
      <p className="text-xs sm:text-sm text-arena-smoke uppercase tracking-widest font-[family-name:var(--font-display)] mb-2">
        {label}
      </p>
      <AnimatedCounter
        value={value}
        suffix="€"
        className={`text-2xl sm:text-4xl font-bold ${textColor[glow]} font-[family-name:var(--font-ui)] tracking-wide`}
      />
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SPOTIFY CONTAINER
   ═══════════════════════════════════════════════════════════════════ */

function SpotifyEmbed({ url }: { url: string | null }) {
  if (!url) {
    return (
      <div className="relative rounded-lg border border-arena-gold/15 bg-gradient-to-b from-arena-iron/60 to-arena-dark/80 p-8 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-arena-gold/[0.02] to-transparent pointer-events-none" />
        <svg className="w-10 h-10 mx-auto mb-3 text-arena-ash" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
        <p className="text-arena-ash text-sm">Nenhuma playlist definida para esta sessão</p>
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
      className="relative rounded-lg overflow-hidden group"
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {/* Carved stone frame */}
      <div className="absolute inset-0 rounded-lg border border-arena-gold/20 pointer-events-none z-10 shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)] group-hover:border-arena-gold/40 transition-colors duration-300" />
      <div className="absolute -inset-[1px] rounded-lg bg-gradient-to-b from-arena-gold/10 via-transparent to-arena-gold/5 pointer-events-none z-10 opacity-50 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Header */}
      <div className="bg-gradient-to-r from-arena-iron/90 to-arena-dark/90 px-4 py-3 flex items-center gap-2 border-b border-arena-gold/15">
        <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
        </svg>
        <span className="text-arena-gold-light text-sm font-[family-name:var(--font-display)] tracking-wider">Arena Playlist</span>
      </div>

      {/* Embed */}
      <iframe
        src={embedUrl}
        width="100%"
        height="352"
        frameBorder="0"
        allowFullScreen
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="bg-arena-dark"
      />
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CASINO CARD (REUSED OFFER STYLE)
   ═══════════════════════════════════════════════════════════════════ */

function ActiveCasinoCard({ casino }: { casino: CasinoOfferRow }) {
  const externalUrl = casino.affiliate_url.startsWith("http") ? casino.affiliate_url : `https://${casino.affiliate_url}`;

  return (
    <motion.div
      className="relative rounded-lg border border-arena-gold/20 bg-gradient-to-b from-arena-iron/60 to-arena-dark/80 overflow-hidden group shadow-[0_0_25px_rgba(212,168,67,0.1)]"
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {/* Glow border effect */}
      <div className="absolute -inset-[1px] rounded-lg bg-gradient-to-b from-arena-gold/15 via-transparent to-arena-gold/10 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Playing Now badge */}
      <div className="absolute top-3 right-3 z-20">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-arena-crimson/80 border border-red-500/30 text-[11px] font-bold text-white uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          A Jogar
        </span>
      </div>

      {/* Banner */}
      {casino.banner_url && (
        <div className="relative h-36 sm:h-44 overflow-hidden">
          <img
            src={casino.banner_url}
            alt={casino.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-arena-dark via-arena-dark/30 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="relative p-4 sm:p-5 space-y-4">
        {/* Name + Badge */}
        <div className="flex items-center gap-3">
          {casino.logo_url && (
            <img src={casino.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
          )}
          <div>
            <h3 className="text-lg font-bold text-arena-white font-[family-name:var(--font-display)]">
              {casino.name}
            </h3>
            {casino.badge && (
              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                casino.badge === "HOT" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              }`}>
                {casino.badge}
              </span>
            )}
          </div>
        </div>

        {/* Bonus Info */}
        <div className="space-y-1">
          <p className="text-arena-gold text-xs uppercase tracking-widest font-[family-name:var(--font-display)]">✦ Oferta Exclusiva ✦</p>
          <p className="text-arena-white text-sm">
            {casino.headline} <span className="text-arena-gold font-bold">{casino.bonus_value}</span>
          </p>
          {casino.free_spins && casino.free_spins !== "—" && (
            <p className="text-arena-smoke text-xs">+ {casino.free_spins} Free Spins</p>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-arena-dark/60 rounded-md p-2 border border-arena-gold/10">
            <p className="text-[10px] text-arena-ash uppercase">Levantamento</p>
            <p className="text-xs text-arena-white font-bold">{casino.withdraw_time}</p>
          </div>
          <div className="bg-arena-dark/60 rounded-md p-2 border border-arena-gold/10">
            <p className="text-[10px] text-arena-ash uppercase">Licença</p>
            <p className="text-xs text-arena-white font-bold">{casino.license}</p>
          </div>
          <div className="bg-arena-dark/60 rounded-md p-2 border border-arena-gold/10">
            <p className="text-[10px] text-arena-ash uppercase">Dep. Mín.</p>
            <p className="text-xs text-arena-white font-bold">{casino.min_deposit}</p>
          </div>
        </div>

        {/* CTA */}
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center py-3 px-4 rounded-lg bg-gradient-to-r from-arena-crimson to-red-800 hover:from-red-700 hover:to-red-600 text-white font-bold text-sm uppercase tracking-wider transition-all duration-300 border border-red-500/30 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] font-[family-name:var(--font-display)]"
        >
          ⚔ Resgatar Bónus ⚔
        </a>
        <p className="text-[10px] text-arena-ash text-center">18+ · T&Cs Aplicáveis · Joga com responsabilidade</p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export default function DailySessionContent() {
  const searchParams = useSearchParams();
  const isOverlay = searchParams.get("overlay") === "true";
  const [session, setSession] = useState<DailySessionData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/daily-session");
      const data = await res.json();
      if (data.session) setSession(data.session);
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
                <div className="px-4 py-2 rounded-lg bg-arena-dark/50 border border-arena-gold/10">
                  <p className="text-[10px] text-arena-ash uppercase tracking-wider">Bónus Jogados</p>
                  <p className="text-xl text-arena-gold font-bold">{session.bonuses_count}</p>
                </div>
              )}
              {session.biggest_win > 0 && (
                <div className="px-4 py-2 rounded-lg bg-arena-dark/50 border border-arena-gold/10">
                  <p className="text-[10px] text-arena-ash uppercase tracking-wider">Maior Vitória</p>
                  <p className="text-xl text-green-400 font-bold">{session.biggest_win.toFixed(2)}€</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── 2-Column Layout ─────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* LEFT: Casino Card */}
            <div>
              {session.casino ? (
                <ActiveCasinoCard casino={session.casino} />
              ) : (
                <div className="rounded-lg border border-arena-gold/10 bg-arena-dark/50 p-8 text-center">
                  <p className="text-arena-ash">Nenhum casino selecionado</p>
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
