"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import type { Victory } from "./types";
import { PROVIDERS } from "./types";

type EditState = Partial<Victory>;

export default function ModeratorPanel() {
  const [items, setItems] = useState<Victory[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<string, EditState>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/hall-of-victors?pending=1", { cache: "no-store" });
      const j = await res.json();
      if (res.ok) setItems(j.victories ?? []);
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  function setField(id: string, field: keyof Victory, value: unknown) {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function approve(v: Victory) {
    setBusy(v.id);
    try {
      const e = edits[v.id] ?? {};
      const res = await fetch(`/api/hall-of-victors/${v.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", ...e }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Falha");
      setMsg(`Aprovado · ${j.awarded ?? 0} pts atribuídos`);
      setItems(prev => prev.filter(x => x.id !== v.id));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro");
    } finally { setBusy(null); }
  }

  async function reject(v: Victory) {
    const reason = window.prompt("Motivo da rejeição (opcional):") ?? undefined;
    setBusy(v.id);
    try {
      const res = await fetch(`/api/hall-of-victors/${v.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Falha");
      setMsg("Rejeitado");
      setItems(prev => prev.filter(x => x.id !== v.id));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro");
    } finally { setBusy(null); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-arena-gold-light uppercase tracking-widest">
          Hall of Victors · Moderação
        </h2>
        <button onClick={load} className="text-sm text-arena-smoke hover:text-arena-gold-light">↻ Atualizar</button>
      </div>

      {msg && (
        <div className="text-sm px-3 py-2 rounded border border-arena-gold/40 bg-arena-gold/10 text-arena-gold-light">
          {msg}
        </div>
      )}

      {loading && <div className="text-arena-smoke">A carregar…</div>}
      {!loading && items.length === 0 && (
        <div className="text-arena-smoke italic">Nenhuma vitória pendente.</div>
      )}

      <AnimatePresence>
        {items.map(v => {
          const e = edits[v.id] ?? {};
          const merged = { ...v, ...e };
          const mult = merged.bet_amount && merged.bet_amount > 0
            ? (merged.win_amount as number) / (merged.bet_amount as number) : v.multiplier;
          return (
            <motion.div
              key={v.id} layout
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
              className="rounded-xl overflow-hidden border border-arena-gold/30"
              style={{ background: "rgba(20,14,8,0.92)" }}
            >
              <div className="grid md:grid-cols-[260px_1fr] gap-4 p-4">
                <div className="relative aspect-[5/4] rounded overflow-hidden bg-black/50">
                  <Image src={v.image_url} alt={v.slot_name} fill sizes="260px" className="object-cover" unoptimized />
                  {v.suspicious && (
                    <div className="absolute top-1 left-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-700 text-white">
                      ⚠ SUSPEITO
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="text-arena-smoke text-xs">
                    Por <span className="text-arena-gold-light">@{v.username}</span> ·{" "}
                    {new Date(v.created_at).toLocaleString("pt-PT")}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Inp label="Slot" value={merged.slot_name} onChange={x => setField(v.id, "slot_name", x)} />
                    <Sel label="Provedor" value={merged.provider} onChange={x => setField(v.id, "provider", x)} />
                    <Inp label="Aposta €" type="number" value={String(merged.bet_amount)}
                      onChange={x => setField(v.id, "bet_amount", parseFloat(x))} />
                    <Inp label="Ganho €" type="number" value={String(merged.win_amount)}
                      onChange={x => setField(v.id, "win_amount", parseFloat(x))} />
                  </div>

                  {merged.caption && (
                    <div className="text-arena-smoke text-xs italic">"{merged.caption}"</div>
                  )}

                  <div className="font-[family-name:var(--font-display)] text-2xl text-arena-gold-light">
                    ×{mult.toLocaleString("pt-PT", { maximumFractionDigits: 2 })}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      disabled={busy === v.id}
                      onClick={() => approve(v)}
                      className="px-4 py-2 rounded font-bold uppercase tracking-widest text-sm disabled:opacity-50"
                      style={{ background: "linear-gradient(180deg,#2d7a3a,#1a4521)", color: "#e8ffe8", border: "1px solid #4ade80" }}
                    >
                      Aprovar (+300 pts)
                    </button>
                    <button
                      disabled={busy === v.id}
                      onClick={() => reject(v)}
                      className="px-4 py-2 rounded font-bold uppercase tracking-widest text-sm disabled:opacity-50"
                      style={{ background: "linear-gradient(180deg,#7d1f15,#3a0e08)", color: "#ffe0d6", border: "1px solid #c0392b" }}
                    >
                      Rejeitar
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function Inp({ label, value, onChange, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-widest text-arena-smoke mb-1">{label}</div>
      <input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1.5 rounded bg-black/50 border border-arena-gold/30 text-arena-white text-sm focus:outline-none focus:border-arena-gold-light" />
    </label>
  );
}

function Sel({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-widest text-arena-smoke mb-1">{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1.5 rounded bg-black/50 border border-arena-gold/30 text-arena-white text-sm">
        {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
        {!PROVIDERS.includes(value as typeof PROVIDERS[number]) && value && <option value={value}>{value}</option>}
      </select>
    </label>
  );
}
