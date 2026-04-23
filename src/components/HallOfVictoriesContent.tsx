"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import WinCard from "./WinCard";
import AddWinForm from "./AddWinForm";
import EmbedRenderer from "./EmbedRenderer";
import type { WinClip } from "./WinCard";
import type { EmbedType } from "./EmbedRenderer";

type SortMode = "created_at" | "honors";
type TabMode  = "featured" | "community";

interface BrutaDoMes {
  id: string;
  month_label: string;
  title: string;
  description: string | null;
  url: string;
  provider: string | null;
  embed_type: EmbedType;
  embed_url: string;
  created_at: string;
}

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "created_at", label: "Mais Recentes" },
  { value: "honors",     label: "Mais Honradas"  },
];

const PAGE_SIZE_DISPLAY = 20;

/* ── Featured win section ───────────────────────────────────── */
function FeaturedWin({ win, loading }: { win: BrutaDoMes | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="animate-pulse rounded papyrus-scroll papyrus-scroll-top papyrus-scroll-bottom" style={{ minHeight: 320 }} />
    );
  }
  if (!win) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="papyrus-scroll papyrus-scroll-top papyrus-scroll-bottom greek-key-border"
        style={{ padding: "4rem 2rem", textAlign: "center" }}
      >
        <div className="text-5xl mb-5">⚔️</div>
        <h3 className="font-[family-name:var(--font-display)] text-2xl mb-3 tracking-wide" style={{ color: "var(--ink-dark)" }}>
          Aguardando Julgamento
        </h3>
        <p className="text-sm max-w-md mx-auto" style={{ color: "var(--ink-mid)" }}>
          O admin ainda não escolheu a vitória mais épica deste mês. Em breve, a glória será revelada.
        </p>
      </motion.div>
    );
  }
  
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="papyrus-scroll papyrus-scroll-top papyrus-scroll-bottom greek-key-border" style={{ maxWidth: "100%", overflow: "hidden" }}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid rgba(180,130,20,0.25)" }}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "var(--gold-dark)", border: "2px solid var(--parchment-edge)" }}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" style={{ color: "var(--parchment-light)" }}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--stone-mid)" }}>Vitória Oficial</div>
                <h2 className="font-[family-name:var(--font-display)] text-xl tracking-wide" style={{ color: "var(--ink-dark)" }}>
                  {win.month_label}
                </h2>
              </div>
            </div>
            {win.provider && (
              <div className="px-3 py-1 rounded" style={{ background: "rgba(180,130,20,0.1)", border: "1px solid rgba(180,130,20,0.3)" }}>
                <span className="text-sm" style={{ color: "var(--ink-mid)" }}>{win.provider}</span>
              </div>
            )}
          </div>
        </div>

        {/* Video embed */}
        <div className="relative aspect-video bg-black/40">
          <EmbedRenderer type={win.embed_type} embedUrl={win.embed_url} title={win.title} />
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="font-[family-name:var(--font-display)] text-2xl tracking-wide mb-2" style={{ color: "var(--ink-dark)" }}>
            {win.title}
          </h3>
          {win.description && (
            <p className="leading-relaxed" style={{ color: "var(--ink-mid)" }}>
              {win.description}
            </p>
          )}
        </div>

        {/* Bottom divider */}
        <div className="h-px" style={{ background: "linear-gradient(90deg,transparent,var(--gold-dark),transparent)" }} />
      </div>
    </motion.article>
  );
}

export default function HallOfVictoriesContent() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabMode>("featured");

  /* ── Featured state ─────────────────────────────────────── */
  const [featured, setFeatured]               = useState<BrutaDoMes | null>(null);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    fetch("/api/bruta-do-mes")
      .then((r) => r.json())
      .then((d) => setFeatured(d.win ?? null))
      .catch(() => {})
      .finally(() => setLoadingFeatured(false));
  }, []);

  /* ── Community wins state ───────────────────────────────── */
  const [clips,   setClips]   = useState<WinClip[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [sort,    setSort]    = useState<SortMode>("created_at");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [honoredIds, setHonoredIds] = useState<Set<string>>(new Set());
  const [communityLoaded, setCommunityLoaded] = useState(false);

  const fetchClips = useCallback(async (p: number, s: SortMode) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/user-clips?page=${p}&sort=${s}`);
      const data = await res.json();
      if (p === 1) {
        setClips(data.clips ?? []);
      } else {
        setClips((prev) => [...prev, ...(data.clips ?? [])]);
      }
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTabChange = (t: TabMode) => {
    setTab(t);
    if (t === "community" && !communityLoaded) {
      setCommunityLoaded(true);
      fetchClips(1, sort);
      setPage(1);
    }
  };

  const handleSortChange = (s: SortMode) => {
    setSort(s);
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

  const handleFormSuccess = () => {
    setShowForm(false);
    setSort("created_at");
    fetchClips(1, "created_at");
    setPage(1);
  };

  const hasMore = clips.length < total && clips.length >= PAGE_SIZE_DISPLAY;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center justify-center gap-2" role="tablist">
        {(["featured", "community"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => handleTabChange(t)}
            className="px-5 py-2 rounded font-medium text-sm font-[family-name:var(--font-display)] tracking-wider uppercase transition-all"
            style={tab === t
              ? { background: "var(--ink-dark)", color: "var(--parchment-light)", border: "2px solid var(--gold-dark)" }
              : { background: "rgba(180,130,20,0.08)", color: "var(--ink-mid)", border: "1px solid rgba(180,130,20,0.3)" }}
          >
            {t === "featured" ? "⭐ Bruta do Mês" : "⚔ Comunidade"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {tab === "featured" ? (
          <motion.div
            key="featured"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <FeaturedWin win={featured} loading={loadingFeatured} />
          </motion.div>
        ) : (
          <motion.div
            key="community"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Community Controls */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2" role="group">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleSortChange(opt.value)}
                    className="px-4 py-2 rounded font-medium text-sm transition-all font-[family-name:var(--font-display)] tracking-wider"
                    style={sort === opt.value
                      ? { background: "var(--ink-dark)", color: "var(--parchment-light)", border: "1px solid var(--gold-dark)" }
                      : { background: "transparent", color: "var(--stone-mid)", border: "1px solid rgba(180,130,20,0.2)" }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {user ? (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-5 py-2 rounded font-medium flex items-center gap-2 font-[family-name:var(--font-display)] tracking-wider text-sm transition-all"
                  style={{ background: "rgba(180,130,20,0.12)", color: "var(--ink-dark)", border: "1px solid var(--gold-dark)" }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Registar Vitória
                </button>
              ) : (
                <p className="text-sm italic" style={{ color: "var(--stone-mid)" }}>
                  Faz login para partilhar as tuas vitórias
                </p>
              )}
            </div>

            {/* Community Grid */}
            {loading && clips.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded h-80"
                    style={{ background: "rgba(245,230,200,0.08)", border: "1px solid rgba(180,130,20,0.15)" }}
                  />
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
                  Nenhuma vitória registada
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Win Modal */}
      <AnimatePresence>
        {showForm && (
          <AddWinForm onSuccess={handleFormSuccess} onCancel={() => setShowForm(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
