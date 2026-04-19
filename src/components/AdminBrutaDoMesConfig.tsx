"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EmbedRenderer from "./EmbedRenderer";
import type { EmbedType } from "./EmbedRenderer";

interface BrutaDoMes {
  id: string;
  month_label: string;
  title: string;
  description: string | null;
  url: string;
  provider: string | null;
  embed_type: EmbedType;
  embed_url: string;
  is_active: boolean;
  created_at: string;
}

const PROVIDERS = ["Stake", "BC.Game", "Pragmatic", "Betano", "ESC Online", "Solverde", "Outro"] as const;

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
        type === "success"
          ? "bg-green-900/90 text-green-200 border border-green-700/50"
          : "bg-red-900/90 text-red-200 border border-red-700/50"
      }`}
    >
      {message}
    </motion.div>
  );
}

export default function AdminBrutaDoMesConfig() {
  const [current, setCurrent] = useState<BrutaDoMes | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  /* ── Form state ─────────────────────────────────────────── */
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [provider, setProvider] = useState<string>("Outro");
  const [monthLabel, setMonthLabel] = useState(() => {
    const now = new Date();
    return now.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
  });
  const [error, setError] = useState<string | null>(null);

  /* ── Load current featured win ──────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/bruta-do-mes");
        const data = await res.json();
        setCurrent(data.win ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── Submit new featured win ────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!url.trim()) { setError("Insere o URL do vídeo."); return; }
    if (!title.trim()) { setError("Insere um título."); return; }
    if (!monthLabel.trim()) { setError("Insere o mês."); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/bruta-do-mes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, title, description, provider, month_label: monthLabel }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao guardar"); return; }
      setCurrent(data.win);
      setUrl(""); setTitle(""); setDescription(""); setProvider("Outro");
      setToast({ message: "Bruta do Mês definida com sucesso!", type: "success" });
    } catch {
      setError("Erro de rede. Tenta novamente.");
    } finally {
      setSaving(false);
    }
  };

  /* ── Remove current ─────────────────────────────────────── */
  const handleRemove = async () => {
    if (!confirm("Remover a Bruta do Mês atual?")) return;
    setRemoving(true);
    try {
      const res = await fetch("/api/bruta-do-mes", { method: "DELETE" });
      if (res.ok) {
        setCurrent(null);
        setToast({ message: "Bruta do Mês removida.", type: "success" });
      }
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <AnimatePresence>
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1 className="text-2xl font-semibold text-arena-gold mb-2" style={{ fontFamily: "var(--font-display)" }}>
          Bruta do Mês
        </h1>
        <p className="text-sm text-arena-smoke/60 mb-8">
          Define a melhor vitória do mês. Esta será mostrada em destaque na página, antes das vitórias da comunidade.
        </p>

        {/* ── Current featured win preview ─────────────────── */}
        {loading ? (
          <div className="bdm-admin-skeleton" aria-hidden="true" />
        ) : current ? (
          <div className="bdm-admin-current">
            <div className="bdm-admin-current__header">
              <div>
                <span className="bdm-admin-current__month">{current.month_label}</span>
                <h2 className="bdm-admin-current__title">{current.title}</h2>
              </div>
              <button
                className="bdm-admin-current__remove-btn"
                onClick={handleRemove}
                disabled={removing}
              >
                {removing ? "A remover…" : "Remover"}
              </button>
            </div>

            <div className="bdm-admin-current__embed">
              <EmbedRenderer
                type={current.embed_type}
                embedUrl={current.embed_url}
                title={current.title}
              />
            </div>

            {current.description && (
              <p className="bdm-admin-current__desc">{current.description}</p>
            )}
          </div>
        ) : (
          <div className="bdm-admin-empty">
            <p>Nenhuma Bruta do Mês definida.</p>
          </div>
        )}

        {/* ── Form to set new featured win ─────────────────── */}
        <div className="bdm-admin-form-wrap">
          <h3 className="bdm-admin-form-wrap__heading">
            {current ? "Substituir Bruta do Mês" : "Definir Bruta do Mês"}
          </h3>

          <form onSubmit={handleSubmit} className="bdm-admin-form" noValidate>
            <div className="bdm-admin-form__field">
              <label className="bdm-admin-form__label">Mês</label>
              <input
                className="bdm-admin-form__input"
                type="text"
                value={monthLabel}
                onChange={(e) => setMonthLabel(e.target.value)}
                placeholder="ex: Abril 2026"
                maxLength={60}
              />
            </div>

            <div className="bdm-admin-form__field">
              <label className="bdm-admin-form__label">URL do vídeo / clip</label>
              <input
                className="bdm-admin-form__input"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... ou clip.twitch.tv/..."
              />
              <span className="bdm-admin-form__hint">YouTube, Twitch clip, ou link direto para vídeo.</span>
            </div>

            <div className="bdm-admin-form__field">
              <label className="bdm-admin-form__label">Título</label>
              <input
                className="bdm-admin-form__input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex: Mega Big Win no Gates of Olympus"
                maxLength={120}
              />
            </div>

            <div className="bdm-admin-form__field">
              <label className="bdm-admin-form__label">Casino / Provedor</label>
              <select
                className="bdm-admin-form__select"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              >
                {PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="bdm-admin-form__field">
              <label className="bdm-admin-form__label">Descrição (opcional)</label>
              <textarea
                className="bdm-admin-form__textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Conta a história desta vitória épica…"
                maxLength={500}
                rows={3}
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  className="bdm-admin-form__error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="bdm-admin-form__actions">
              <button
                type="submit"
                className="bdm-admin-form__submit-btn"
                disabled={saving}
              >
                {saving ? (
                  <span className="bdm-admin-form__spinner" aria-hidden="true" />
                ) : (
                  current ? "Substituir" : "Definir como Bruta do Mês"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
