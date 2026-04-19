"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import WinCard from "./WinCard";
import AddWinForm from "./AddWinForm";
import type { WinClip } from "./WinCard";

type SortMode = "created_at" | "honors";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "created_at", label: "Mais Recentes" },
  { value: "honors",     label: "Mais Honradas"  },
];

export default function HallOfVictoriesContent() {
  const { user } = useAuth();

  const [clips,    setClips]    = useState<WinClip[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [sort,     setSort]     = useState<SortMode>("created_at");
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);

  /* Track which clips the current user has honored (client-only, not persisted) */
  const [honoredIds, setHonoredIds] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    fetchClips(1, sort);
    setPage(1);
  }, [sort, fetchClips]);

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

  const hasMore = clips.length < total;

  return (
    <div className="hov-page">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="hov-topbar">
        {/* Sort pills */}
        <div className="hov-sort-pills" role="group" aria-label="Ordenar por">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`hov-sort-pill${sort === opt.value ? " hov-sort-pill--active" : ""}`}
              onClick={() => setSort(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Submit button */}
        {user ? (
          <button
            className="hov-submit-btn"
            onClick={() => setShowForm(true)}
          >
            <svg className="hov-submit-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Registar Vitória
          </button>
        ) : (
          <p className="hov-login-hint">
            Faz login para partilhar as tuas vitórias
          </p>
        )}
      </div>

      {/* ── Clip grid ───────────────────────────────────────── */}
      {loading && clips.length === 0 ? (
        <div className="hov-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="hov-skeleton" aria-hidden="true" />
          ))}
        </div>
      ) : clips.length === 0 ? (
        <motion.div
          className="hov-empty"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
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
        <motion.div
          className="hov-grid"
          layout
        >
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

      {/* ── Load more ───────────────────────────────────────── */}
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

      {/* ── Add win modal ────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <AddWinForm
            onSuccess={handleFormSuccess}
            onCancel={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
