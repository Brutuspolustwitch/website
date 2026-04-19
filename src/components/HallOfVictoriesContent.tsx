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
    return <div className="bdm-featured-skeleton" aria-hidden="true" />;
  }
  if (!win) {
    return (
      <div className="bdm-featured-empty">
        <svg className="bdm-featured-empty__icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1}>
          <path d="M24 4L6 12v12c0 10.5 7.5 20.3 18 22.67C34.5 44.3 42 34.5 42 24V12L24 4Z" />
          <path d="M17 24l5 5 9-9" strokeWidth={2} />
        </svg>
        <p className="bdm-featured-empty__text">Nenhuma Bruta do Mês definida ainda</p>
        <p className="bdm-featured-empty__sub">O admin ainda não escolheu a melhor vitória deste mês.</p>
      </div>
    );
  }
  return (
    <motion.article
      className="bdm-featured"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <div className="bdm-featured__month-row">
        <span className="bdm-featured__month-badge">
          <svg className="bdm-featured__crown" viewBox="0 0 20 14" fill="currentColor">
            <path d="M0 14 L3 4 L7 9 L10 0 L13 9 L17 4 L20 14 Z" />
          </svg>
          {win.month_label}
        </span>
        {win.provider && <span className="bdm-featured__provider">{win.provider}</span>}
      </div>
      <div className="bdm-featured__embed">
        <EmbedRenderer type={win.embed_type} embedUrl={win.embed_url} title={win.title} />
      </div>
      <div className="bdm-featured__body">
        <div className="bdm-featured__game-row">
          <svg className="bdm-featured__game-icon" viewBox="0 0 20 14" fill="currentColor" aria-hidden="true">
            <path d="M0 14 L3 4 L7 9 L10 0 L13 9 L17 4 L20 14 Z" />
          </svg>
          <h2 className="bdm-featured__title">{win.title}</h2>
        </div>
        {win.description && <p className="bdm-featured__desc">{win.description}</p>}
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
    <div className="hov-page">
      {/* ── Tab switcher ────────────────────────────────────── */}
      <div className="hov-tabs" role="tablist" aria-label="Secções">
        <button
          role="tab"
          aria-selected={tab === "featured"}
          className={`hov-tab${tab === "featured" ? " hov-tab--active" : ""}`}
          onClick={() => handleTabChange("featured")}
        >
          <svg className="hov-tab__icon" viewBox="0 0 20 14" fill="currentColor">
            <path d="M0 14 L3 4 L7 9 L10 0 L13 9 L17 4 L20 14 Z" />
          </svg>
          Bruta do Mês
        </button>
        <button
          role="tab"
          aria-selected={tab === "community"}
          className={`hov-tab${tab === "community" ? " hov-tab--active" : ""}`}
          onClick={() => handleTabChange("community")}
        >
          <svg className="hov-tab__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Vitórias da Comunidade
        </button>
      </div>

      {/* ── Tab content ─────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {tab === "featured" ? (
          <motion.div
            key="featured"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <FeaturedWin win={featured} loading={loadingFeatured} />
          </motion.div>
        ) : (
          <motion.div
            key="community"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {/* Top bar */}
            <div className="hov-topbar">
              <div className="hov-sort-pills" role="group" aria-label="Ordenar por">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`hov-sort-pill${sort === opt.value ? " hov-sort-pill--active" : ""}`}
                    onClick={() => handleSortChange(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {user ? (
                <button className="hov-submit-btn" onClick={() => setShowForm(true)}>
                  <svg className="hov-submit-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Registar Vitória
                </button>
              ) : (
                <p className="hov-login-hint">Faz login para partilhar as tuas vitórias</p>
              )}
            </div>

            {/* Grid */}
            {loading && clips.length === 0 ? (
              <div className="hov-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="hov-skeleton" aria-hidden="true" />
                ))}
              </div>
            ) : clips.length === 0 ? (
              <motion.div className="hov-empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="hov-empty__icon" aria-hidden="true">
                  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1}>
                    <path d="M24 4L6 12v12c0 10.5 7.5 20.3 18 22.67C34.5 44.3 42 34.5 42 24V12L24 4Z" />
                    <path d="M18 24l4 4 8-8" strokeWidth={2} />
                  </svg>
                </div>
                <p className="hov-empty__text">Nenhuma vitória registada ainda</p>
                <p className="hov-empty__sub">Sê o primeiro a reclamar glória!</p>
              </motion.div>
            ) : (
              <motion.div className="hov-grid" layout>
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

            {hasMore && !loading && (
              <div className="hov-loadmore">
                <button className="hov-loadmore-btn" onClick={handleLoadMore}>
                  Carregar mais Vitórias
                </button>
              </div>
            )}
            {loading && clips.length > 0 && (
              <div className="hov-loading-more" aria-live="polite">
                <span className="hov-spinner" aria-hidden="true" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add win modal ─────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <AddWinForm onSuccess={handleFormSuccess} onCancel={() => setShowForm(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
