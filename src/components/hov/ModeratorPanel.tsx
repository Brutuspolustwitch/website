"use client";

import { useEffect, useState, useRef } from "react";
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
  const [uploading, setUploading] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      // Fetch all victories (no filter)
      const res = await fetch("/api/hall-of-victors", { cache: "no-store" });
      const j = await res.json();
      if (res.ok) setItems(j.victories ?? []);
    } finally { setLoading(false); }
  }
  async function removeVictory(v: Victory) {
    if (!window.confirm("Remover esta vitória? Esta ação é irreversível.")) return;
    setBusy(v.id);
    try {
      const res = await fetch(`/api/hall-of-victors/${v.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error((await res.json()).error || "Falha ao remover");
      setMsg("Removido");
      setItems(prev => prev.filter(x => x.id !== v.id));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro");
    } finally { setBusy(null); }
  }

  useEffect(() => { void load(); }, []);

  function setField(id: string, field: keyof Victory, value: unknown) {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function uploadImage(id: string, file: File) {
    setUploading(id); setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/hall-of-victors/upload", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Falha no upload");
      setField(id, "image_url", j.url);
      // Persist immediately on the server
      await fetch(`/api/hall-of-victors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: j.url }),
      });
      setItems(prev => prev.map(v => v.id === id ? { ...v, image_url: j.url } : v));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro");
    } finally { setUploading(null); }
  }

  async function approve(v: Victory) {
    const e = edits[v.id] ?? {};
    const finalImage = (e.image_url ?? v.image_url) ?? null;
    if (!finalImage) {
      setMsg("Adiciona uma imagem antes de aprovar.");
      return;
    }
    setBusy(v.id);
    try {
      const res = await fetch(`/api/hall-of-victors/${v.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", ...e }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Falha");
      setMsg(`Aprovado · ${j.awarded ?? 0} pts atribuídos`);
      setItems(prev => prev.filter(x => x.id !== v.id));
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Erro");
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
          Bruta do Mês · Moderação
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
        <div className="text-arena-smoke italic">Nenhuma vitória encontrada.</div>
      )}

      {/* Group by status for clarity */}
      {['pending', 'approved', 'rejected'].map(status => (
        <div key={status} className="mt-8">
          <h3 className="font-[family-name:var(--font-display)] text-lg text-arena-gold-light uppercase tracking-widest mb-2">
            {status === 'pending' ? 'Pendentes' : status === 'approved' ? 'Aprovadas' : 'Rejeitadas'}
          </h3>
          <AnimatePresence>
            {items.filter(v => v.status === status).map(v => {
              const e = edits[v.id] ?? {};
              const merged = { ...v, ...e };
              const mult = merged.bet_amount && merged.bet_amount > 0
                ? (merged.win_amount as number) / (merged.bet_amount as number) : v.multiplier;
              return (
                <ModRow
                  key={v.id}
                  v={v} merged={merged} mult={mult}
                  busy={busy === v.id} uploading={uploading === v.id}
                  setField={(f, val) => setField(v.id, f, val)}
                  onUpload={(file) => uploadImage(v.id, file)}
                  onApprove={() => approve(v)}
                  onReject={() => reject(v)}
                  onRemove={() => removeVictory(v)}
                />
              );
            })}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

function ModRow({
  v, merged, mult, busy, uploading,
  setField, onUpload, onApprove, onReject, onRemove,
}: {
  v: Victory; merged: Victory; mult: number;
  busy: boolean; uploading: boolean;
  setField: (f: keyof Victory, val: unknown) => void;
  onUpload: (file: File) => void;
  onApprove: () => void;
  onReject: () => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
      className="rounded-xl overflow-hidden border border-arena-gold/30"
      style={{ background: "rgba(20,14,8,0.92)" }}
    >
      <div className="grid md:grid-cols-[260px_1fr] gap-4 p-4">
        {/* Image slot */}
        <div>
          <div
            onClick={() => fileRef.current?.click()}
            className="relative aspect-[5/4] rounded overflow-hidden bg-black/50 border border-dashed border-arena-gold/40 cursor-pointer flex items-center justify-center"
          >
            {merged.image_url ? (
              <>
                <Image src={merged.image_url} alt={merged.slot_name} fill sizes="260px" className="object-cover" unoptimized />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition flex items-center justify-center text-xs uppercase tracking-widest text-arena-gold-light">
                  {uploading ? "A carregar…" : "Substituir imagem"}
                </div>
              </>
            ) : (
              <span className="text-arena-smoke text-xs px-3 text-center">
                {uploading ? "A carregar…" : "Clica para adicionar imagem"}
              </span>
            )}
            {v.suspicious && (
              <div className="absolute top-1 left-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-700 text-white">
                ⚠ SUSPEITO
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }}
          />
        </div>

        <div className="space-y-2 text-sm">
          <div className="text-arena-smoke text-xs">
            Por <span className="text-arena-gold-light">@{v.username}</span> ·{" "}
            {new Date(v.created_at).toLocaleString("pt-PT")}
          </div>

          {merged.url && (
            <a href={merged.url} target="_blank" rel="noreferrer"
              className="block truncate text-xs text-blue-400 hover:text-blue-300 underline">
              🔗 {merged.url}
            </a>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Inp label="Slot" value={merged.slot_name} onChange={x => setField("slot_name", x)} />
            <Sel label="Provedor" value={merged.provider} onChange={x => setField("provider", x)} />
            <Inp label="Aposta €" type="number" value={String(merged.bet_amount)}
              onChange={x => setField("bet_amount", parseFloat(x))} />
            <Inp label="Ganho €" type="number" value={String(merged.win_amount)}
              onChange={x => setField("win_amount", parseFloat(x))} />
            <div className="col-span-2">
              <Inp label="Link" value={merged.url ?? ""} onChange={x => setField("url", x)} />
            </div>
          </div>

          {merged.caption && (
            <div className="text-arena-smoke text-xs italic">&ldquo;{merged.caption}&rdquo;</div>
          )}

          <div className="font-[family-name:var(--font-display)] text-2xl text-arena-gold-light">
            ×{mult.toLocaleString("pt-PT", { maximumFractionDigits: 2 })}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              disabled={busy || !merged.image_url}
              onClick={onApprove}
              title={!merged.image_url ? "Adiciona uma imagem primeiro" : "Aprovar"}
              className="px-4 py-2 rounded font-bold uppercase tracking-widest text-sm disabled:opacity-50"
              style={{ background: "linear-gradient(180deg,#2d7a3a,#1a4521)", color: "#e8ffe8", border: "1px solid #4ade80" }}
            >
              Aprovar (+300 pts)
            </button>
            <button
              disabled={busy}
              onClick={onReject}
              className="px-4 py-2 rounded font-bold uppercase tracking-widest text-sm disabled:opacity-50"
              style={{ background: "linear-gradient(180deg,#7d1f15,#3a0e08)", color: "#ffe0d6", border: "1px solid #c0392b" }}
            >
              Rejeitar
            </button>
            <button
              disabled={busy}
              onClick={onRemove}
              className="px-4 py-2 rounded font-bold uppercase tracking-widest text-sm disabled:opacity-50"
              style={{ background: "linear-gradient(180deg,#222,#000)", color: "#fff", border: "1px solid #888" }}
            >
              Remover
            </button>
          </div>
        </div>
      </div>
    </motion.div>
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
