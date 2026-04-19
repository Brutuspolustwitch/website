"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PROVIDERS = ["Stake", "BC.Game", "Pragmatic", "Betano", "ESC Online", "Solverde", "Outro"] as const;

interface AddWinFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddWinForm({ onSuccess, onCancel }: AddWinFormProps) {
  const [url, setUrl]               = useState("");
  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [provider, setProvider]     = useState<string>("Outro");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!url.trim()) { setError("Insere o URL do teu clip ou vídeo."); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/user-clips", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ url, title, description, provider }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao submeter"); return; }
      onSuccess();
    } catch {
      setError("Erro de rede. Tenta novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      className="add-win-form__overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <motion.div
        className="add-win-form"
        initial={{ opacity: 0, scale: 0.96, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -20 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-win-title"
      >
        {/* Header */}
        <div className="add-win-form__header">
          <div className="add-win-form__laurel" aria-hidden="true">
            <svg viewBox="0 0 64 24" fill="none" stroke="currentColor" strokeWidth={1.2}>
              <path d="M4 12 C10 4, 20 4, 26 12 C20 20, 10 20, 4 12Z" />
              <path d="M60 12 C54 4, 44 4, 38 12 C44 20, 54 20, 60 12Z" />
              <line x1="26" y1="12" x2="38" y2="12" />
            </svg>
          </div>
          <h2 id="add-win-title" className="add-win-form__title">Registar Vitória</h2>
          <button
            className="add-win-form__close"
            onClick={onCancel}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* URL field */}
          <div className="add-win-form__field">
            <label className="add-win-form__label" htmlFor="win-url">
              URL do Clip / Vídeo <span aria-hidden="true">*</span>
            </label>
            <input
              id="win-url"
              type="url"
              className="add-win-form__input"
              placeholder="https://youtube.com/watch?v=... ou link directo"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              autoFocus
              autoComplete="off"
            />
            <span className="add-win-form__hint">YouTube ou link directo (.mp4)</span>
          </div>

          {/* Title field */}
          <div className="add-win-form__field">
            <label className="add-win-form__label" htmlFor="win-title">
              Título da Vitória
            </label>
            <input
              id="win-title"
              type="text"
              className="add-win-form__input"
              placeholder="ex: Big Win 2000x no Book of Dead"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
            />
          </div>

          {/* Provider */}
          <div className="add-win-form__field">
            <label className="add-win-form__label" htmlFor="win-provider">Casino / Provider</label>
            <select
              id="win-provider"
              className="add-win-form__select"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            >
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="add-win-form__field">
            <label className="add-win-form__label" htmlFor="win-desc">Descrição</label>
            <textarea
              id="win-desc"
              className="add-win-form__textarea"
              placeholder="Conta a história desta vitória lendária..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                className="add-win-form__error"
                role="alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="add-win-form__actions">
            <button
              type="button"
              className="add-win-form__cancel-btn"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="add-win-form__submit-btn"
              disabled={submitting}
            >
              {submitting ? (
                <span className="add-win-form__spinner" aria-hidden="true" />
              ) : (
                "Gravar na Pedra"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
