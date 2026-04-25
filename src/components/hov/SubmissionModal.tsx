"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PROVIDERS } from "./types";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
};

export default function SubmissionModal({ open, onClose, onSubmitted }: Props) {
  const [slotName, setSlotName] = useState("");
  const [provider, setProvider] = useState<string>(PROVIDERS[0]);
  const [bet, setBet] = useState("");
  const [win, setWin] = useState("");
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const betN = parseFloat(bet.replace(",", "."));
  const winN = parseFloat(win.replace(",", "."));
  const mult = betN > 0 && isFinite(winN) ? winN / betN : 0;

  function reset() {
    setSlotName(""); setProvider(PROVIDERS[0]); setBet(""); setWin("");
    setUrl(""); setCaption(""); setError(null);
  }

  async function submit() {
    setError(null);
    if (!slotName.trim()) return setError("Nome da slot obrigatório");
    if (!(betN > 0)) return setError("Aposta inválida");
    if (!(winN >= 0)) return setError("Ganho inválido");
    if (!url.trim() || !/^https?:\/\//i.test(url.trim())) {
      return setError("Link da vitória obrigatório (https://…)");
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/hall-of-victors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot_name: slotName.trim(),
          provider, bet_amount: betN, win_amount: winN,
          url: url.trim(),
          caption: caption.trim() || undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Falha");
      reset();
      onSubmitted();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(180deg, rgba(30,22,12,0.98), rgba(14,10,6,0.99))",
              border: "1px solid rgba(240,215,140,0.55)",
              boxShadow: "0 0 40px rgba(255,180,71,0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <header
              className="px-5 py-3 border-b flex items-center justify-between"
              style={{ borderColor: "rgba(240,215,140,0.35)", background: "rgba(0,0,0,0.45)" }}
            >
              <h2 className="font-[family-name:var(--font-display)] uppercase tracking-widest text-arena-gold-light">
                Submete a Tua Vitória
              </h2>
              <button onClick={onClose} className="text-arena-smoke hover:text-white text-xl leading-none">×</button>
            </header>

            <div className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">
              <Field label="Nome da Slot">
                <input
                  value={slotName} onChange={(e) => setSlotName(e.target.value)}
                  className={inputCls} placeholder="Gates of Olympus" maxLength={120}
                />
              </Field>

              <Field label="Provedor">
                <select value={provider} onChange={(e) => setProvider(e.target.value)} className={inputCls}>
                  {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Aposta (€)">
                  <input value={bet} onChange={(e) => setBet(e.target.value)}
                    className={inputCls} placeholder="0.20" inputMode="decimal" />
                </Field>
                <Field label="Ganho (€)">
                  <input value={win} onChange={(e) => setWin(e.target.value)}
                    className={inputCls} placeholder="248" inputMode="decimal" />
                </Field>
              </div>

              {mult > 0 && (
                <div className="text-center py-2 rounded font-[family-name:var(--font-display)] text-2xl font-black"
                  style={{
                    background: "rgba(60,40,10,0.6)",
                    color: mult > 10000 ? "#ff6b6b" : "#f0d78c",
                    textShadow: "0 0 10px rgba(255,180,71,0.5)",
                    border: `1px solid ${mult > 10000 ? "rgba(255,80,80,0.6)" : "rgba(240,215,140,0.4)"}`,
                  }}
                >
                  ×{mult.toLocaleString("pt-PT", { maximumFractionDigits: 2 })}
                  {mult > 10000 && <span className="block text-xs mt-1">⚠ Será marcado como suspeito</span>}
                </div>
              )}

              <Field label="Link da Vitória (obrigatório)">
                <input
                  value={url} onChange={(e) => setUrl(e.target.value)}
                  className={inputCls} placeholder="https://kick.com/clip/… ou https://twitch.tv/…"
                  inputMode="url" maxLength={2048}
                />
                <div className="text-[11px] text-arena-smoke mt-1">
                  Cola o link do clip / replay. A imagem será adicionada por um moderador.
                </div>
              </Field>

              <Field label="Legenda (opcional)">
                <textarea
                  value={caption} onChange={(e) => setCaption(e.target.value)}
                  className={inputCls + " resize-none"} rows={2} maxLength={500}
                  placeholder="Conta a história desta vitória…"
                />
              </Field>

              {error && (
                <div className="text-sm text-red-400 border border-red-500/40 bg-red-500/10 px-3 py-2 rounded">
                  {error}
                </div>
              )}

              <button
                onClick={submit}
                disabled={submitting}
                className="w-full py-3 rounded font-[family-name:var(--font-display)] uppercase tracking-widest font-bold disabled:opacity-50"
                style={{
                  background: "linear-gradient(180deg, #c0392b, #7d1f15)",
                  color: "#fff1d6",
                  border: "1px solid rgba(240,215,140,0.6)",
                  boxShadow: "0 0 20px rgba(199,57,43,0.5)",
                }}
              >
                {submitting ? "A submeter…" : "Enviar para a Arena"}
              </button>
              <p className="text-[11px] text-arena-smoke text-center">
                Máx. 3 submissões por dia · Será revista por um moderador
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const inputCls =
  "w-full px-3 py-2 rounded bg-black/50 border border-arena-gold/30 text-arena-white placeholder:text-arena-ash text-sm focus:outline-none focus:border-arena-gold-light";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-widest text-arena-smoke mb-1">{label}</div>
      {children}
    </label>
  );
}
