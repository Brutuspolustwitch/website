"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import WinCard from "./WinCard";
import AddWinForm from "./AddWinForm";
import EmbedRenderer from "./EmbedRenderer";
import type { WinClip } from "./WinCard";

type SortMode = "created_at" | "honors";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "created_at", label: "Mais Recentes" },
  { value: "honors",     label: "Mais Honradas"  },
];

const PAGE_SIZE_DISPLAY = 20;

const RANK_MEDALS = ["🥇", "🥈", "🥉"] as const;
const RANK_COLORS = [
  { bg: "rgba(212,168,67,0.18)",  border: "rgba(212,168,67,0.55)", text: "#c9a227" },
  { bg: "rgba(160,168,180,0.18)", border: "rgba(160,168,180,0.5)", text: "#a0a8b4" },
  { bg: "rgba(180,110,60,0.18)",  border: "rgba(180,110,60,0.5)",  text: "#b46c3c" },
] as const;

/* ── Helpers ─────────────────────────────────────────────────── */
function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const daysFromMon = day === 0 ? 6 : day - 1;
  const mon = new Date(now);
  mon.setDate(now.getDate() - daysFromMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("pt-PT", { day: "numeric", month: "short" });
  return `${fmt(mon)} – ${fmt(sun)}`;
}

function getMultiplierDisplay(clip: WinClip): string | null {
  if (clip.multiplier !== null && clip.multiplier !== undefined) {
    return `${clip.multiplier % 1 === 0 ? clip.multiplier : clip.multiplier.toFixed(1)}x`;
  }
  const m = clip.description?.match(/^(\d+(?:\.\d+)?)x$/i);
  return m ? m[0] : null;
}

function getPayoutDisplay(clip: WinClip): string | null {
  if (clip.payout_value !== null && clip.payout_value !== undefined) {
    return `${clip.payout_value.toLocaleString("pt-PT")}€`;
  }
  const t = clip.title?.trim();
  if (t && /^\d+(\.\d+)?€$/.test(t)) return t;
  if (t && /^€\d+(\.\d+)?$/.test(t)) return t;
  return null;
}

/* ── Top 3 card ──────────────────────────────────────────────── */
function Top3Card({ clip, rank }: { clip: WinClip; rank: 0 | 1 | 2 }) {
  const [expanded, setExpanded] = useState(false);
  const medal  = RANK_MEDALS[rank];
  const colors = RANK_COLORS[rank];
  const multi  = getMultiplierDisplay(clip);
  const payout = getPayoutDisplay(clip);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: rank * 0.1 }}
      className="flex flex-col overflow-hidden rounded-xl"
      style={{ background: "rgba(18,14,8,0.92)", border: `1px solid ${colors.border}`, boxShadow: `0 4px 24px rgba(0,0,0,0.5)` }}
    >
      {/* Rank header */}
      <div className="flex items-center gap-2 px-4 py-2" style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}` }}>
        <span className="text-2xl leading-none">{medal}</span>
        <span className="text-xs font-bold uppercase tracking-widest font-[family-name:var(--font-display)]"
          style={{ color: colors.text }}>
          {rank === 0 ? "1.º Lugar" : rank === 1 ? "2.º Lugar" : "3.º Lugar"}
        </span>
      </div>

      {/* Thumbnail / embed toggle */}
      <div className="relative aspect-video bg-black/40 cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        {expanded ? (
          <EmbedRenderer type={clip.embed_type} embedUrl={clip.embed_url} title={clip.title} thumbnailUrl={clip.thumbnail_url ?? undefined} />
        ) : (
          <>
            {clip.thumbnail_url ? (
              <Image src={clip.thumbnail_url} alt={clip.slot_name ?? clip.title} fill className="object-cover opacity-80" unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(180,130,20,0.08)" }}>
                <span className="text-4xl opacity-40">🎰</span>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.65)", border: `2px solid ${colors.border}` }}>
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-5 h-5" style={{ color: colors.text }}>
                  <path d="M5 3l9 5-9 5V3z" />
                </svg>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Stats */}
      <div className="px-4 pt-3 pb-4 flex flex-col gap-2">
        {multi && (
          <p className="font-[family-name:var(--font-display)] text-3xl font-bold leading-none" style={{ color: colors.text }}>
            {multi}
          </p>
        )}
        {payout && (
          <p className="text-sm font-bold" style={{ color: "var(--ink-dark)" }}>{payout}</p>
        )}
        {clip.slot_name && (
          <p className="text-xs" style={{ color: "var(--ink-mid)" }}>{clip.slot_name}</p>
        )}
        {clip.provider && (
          <span className="self-start text-xs px-2 py-0.5 rounded" style={{ background: "rgba(180,130,20,0.1)", border: "1px solid rgba(180,130,20,0.25)", color: "var(--stone-mid)" }}>
            {clip.provider}
          </span>
        )}

        {/* User row */}
        <div className="flex items-center gap-2 mt-1 pt-2" style={{ borderTop: "1px solid rgba(180,130,20,0.15)" }}>
          <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0" style={{ background: "rgba(180,130,20,0.2)" }}>
            {clip.avatar_url ? (
              <Image src={clip.avatar_url} alt={clip.username} width={24} height={24} className="object-cover" unoptimized />
            ) : null}
          </div>
          <span className="text-xs font-medium" style={{ color: "var(--ink-mid)" }}>{clip.username}</span>
        </div>
      </div>
    </motion.article>
  );
}

/* ── Empty top3 state ────────────────────────────────────────── */
function EmptyTop3() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="papyrus-scroll papyrus-scroll-top papyrus-scroll-bottom"
      style={{ padding: "3rem 2rem", textAlign: "center" }}
    >
      <div className="text-4xl mb-4">⚔️</div>
      <p className="font-[family-name:var(--font-display)] text-xl mb-2" style={{ color: "var(--ink-dark)" }}>
        A aguardar vitórias desta semana
      </p>
      <p className="text-sm" style={{ color: "var(--ink-mid)" }}>
        Submete a tua vitória — pode ser tu o próximo campeão!
      </p>
    </motion.div>
  );
}

/* ── Main component ──────────────────────────────────────────── */
export default function HallOfVictoriesContent() {
  const { user } = useAuth();

  /* Top 3 */
  const [top3,        setTop3]        = useState<WinClip[]>([]);
  const [loadingTop3, setLoadingTop3] = useState(true);

  /* Community feed */
  const [clips,   setClips]   = useState<WinClip[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [sort,    setSort]    = useState<SortMode>("created_at");
  const [loading, setLoading] = useState(false);

  const [showForm,    setShowForm]    = useState(false);
  const [honoredIds,  setHonoredIds]  = useState<Set<string>>(new Set());

  const isSaturday = new Date().getDay() === 6;
  const weekRange  = getWeekRange();

  /* Fetch top 3 */
  useEffect(() => {
    fetch("/api/user-clips?top3=1")
      .then((r) => r.json())
      .then((d) => setTop3(d.wins ?? []))
      .catch(() => {})
      .finally(() => setLoadingTop3(false));
  }, []);

  /* Fetch community clips */
  const fetchClips = useCallback(async (p: number, s: SortMode) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/user-clips?page=${p}&sort=${s}`);
      const data = await res.json();
      if (p === 1) setClips(data.clips ?? []);
      else setClips((prev) => [...prev, ...(data.clips ?? [])]);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClips(1, sort); }, [fetchClips, sort]);

  const handleSortChange = (s: SortMode) => {
    setSort(s);
    setClips([]);
    fetchClips(1, s);
    setPage(1);
  };

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchClips(next, sort);
  };

  const handleHonor = (id: string) => {
    setHonoredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const hasMore = clips.length < total && clips.length >= PAGE_SIZE_DISPLAY;

  return (
    <div className="space-y-10">

      {/* ══ Top 3 da Semana ══════════════════════════════════════ */}
      <section className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-wide" style={{ color: "var(--ink-dark)" }}>
            🏆 Top 3 da Semana
          </h2>
          <span className="text-xs px-3 py-1 rounded-full" style={{ background: "rgba(180,130,20,0.12)", border: "1px solid rgba(180,130,20,0.3)", color: "var(--stone-mid)" }}>
            {weekRange}
          </span>
        </div>

        {/* Saturday banner */}
        {isSaturday && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg px-5 py-3 text-center"
            style={{ background: "rgba(212,168,67,0.15)", border: "1px solid rgba(212,168,67,0.4)" }}
          >
            <p className="font-[family-name:var(--font-display)] text-sm tracking-wider" style={{ color: "var(--gold-dark)" }}>
              🎉 Os campeões desta semana estão definidos!
            </p>
          </motion.div>
        )}

        {/* Cards */}
        {loadingTop3 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-xl h-64" style={{ background: "rgba(245,230,200,0.06)", border: "1px solid rgba(180,130,20,0.12)" }} />
            ))}
          </div>
        ) : top3.length === 0 ? (
          <EmptyTop3 />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {top3.map((clip, i) => (
              <Top3Card key={clip.id} clip={clip} rank={i as 0 | 1 | 2} />
            ))}
          </div>
        )}
      </section>

      {/* Divider */}
      <div className="h-px" style={{ background: "linear-gradient(90deg,transparent,var(--gold-dark),transparent)" }} />

      {/* ══ Vitórias da Comunidade ════════════════════════════════ */}
      <section className="space-y-6">
        {/* Controls */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="font-[family-name:var(--font-display)] text-xl tracking-wide" style={{ color: "var(--ink-dark)" }}>
            ⚔ Vitórias da Comunidade
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1" role="group">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSortChange(opt.value)}
                  className={sort === opt.value ? "cta-button" : "cta-button-inactive"}
                  style={{ width: "auto", padding: "0 1.1em" }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {user ? (
              <button
                onClick={() => setShowForm(true)}
                className="cta-button"
                style={{ width: "auto", padding: "0 1.25em" }}
              >
                + Registar Vitória
              </button>
            ) : (
              <p className="text-sm italic" style={{ color: "var(--stone-mid)" }}>
                Faz login para partilhar as tuas vitórias
              </p>
            )}
          </div>
        </div>

        {/* Grid */}
        {loading && clips.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded h-80"
                style={{ background: "rgba(245,230,200,0.08)", border: "1px solid rgba(180,130,20,0.15)" }} />
            ))}
          </div>
        ) : clips.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="papyrus-scroll papyrus-scroll-top papyrus-scroll-bottom text-center"
            style={{ padding: "5rem 2rem" }}
          >
            <div className="text-5xl mb-5">⭐</div>
            <h3 className="font-[family-name:var(--font-display)] text-xl mb-2" style={{ color: "var(--ink-dark)" }}>
              Nenhuma vitória aprovada ainda
            </h3>
            <p className="text-sm" style={{ color: "var(--ink-mid)" }}>
              Sê o primeiro guerreiro a reclamar glória!
            </p>
          </motion.div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {clips.map((clip) => (
                <WinCard
                  key={clip.id}
                  clip={clip}
                  currentUserId={user?.id ?? null}
                  onHonor={handleHonor}
                  honored={honoredIds.has(clip.id)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Load More */}
        {hasMore && !loading && (
          <div className="text-center pt-4">
            <button
              onClick={handleLoadMore}
              className="px-8 py-3 rounded font-medium transition-all font-[family-name:var(--font-display)] tracking-wider text-sm"
              style={{ background: "rgba(180,130,20,0.08)", color: "var(--ink-mid)", border: "1px solid rgba(180,130,20,0.3)" }}
            >
              Carregar Mais Vitórias
            </button>
          </div>
        )}

        {loading && clips.length > 0 && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 rounded-full animate-spin"
              style={{ borderColor: "rgba(180,130,20,0.2)", borderTopColor: "var(--gold-dark)" }} />
          </div>
        )}
      </section>

      {/* Add Win Modal */}
      <AnimatePresence>
        {showForm && (
          <AddWinForm
            onSuccess={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}


