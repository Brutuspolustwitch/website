"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Trophy, Clock, CheckCircle, Ban, Check, X, Trash2, Upload } from "lucide-react";
import type { Victory } from "./types";
import { PROVIDERS } from "./types";

type EditState = Partial<Victory>;
type Top3Entry = { id: string; user_id: string; username: string; avatar_url?: string; multiplier: number; rank: number };
type Tab = "top3" | "pending" | "approved" | "rejected";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "top3",     label: "Top 3",     icon: <Trophy   size={13} /> },
  { key: "pending",  label: "Pendentes", icon: <Clock    size={13} /> },
  { key: "approved", label: "Aprovadas", icon: <CheckCircle size={13} /> },
  { key: "rejected", label: "Rejeitadas",icon: <Ban      size={13} /> },
];

const AWARD_AMOUNTS = [1500, 1000, 500];
const RANK_LABELS = ["🥇 1.º", "🥈 2.º", "🥉 3.º"];

export default function ModeratorPanel() {
  const [items,     setItems]     = useState<Victory[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [edits,     setEdits]     = useState<Record<string, EditState>>({});
  const [top3,      setTop3]      = useState<Top3Entry[]>([]);
  const [awarding,  setAwarding]  = useState<string | null>(null);
  const [awarded,   setAwarded]   = useState<Record<string, boolean>>({});
  const [busy,      setBusy]      = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [msg,       setMsg]       = useState<{ text: string; ok: boolean } | null>(null);
  const [tab,       setTab]       = useState<Tab>("top3");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/hall-of-victors", { cache: "no-store" });
      const j = await res.json();
      if (res.ok) setItems(j.victories ?? []);
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    fetch("/api/hall-of-victors/winners")
      .then(r => r.json())
      .then(j => setTop3(j.live_top3 ?? []));
  }, []);

  function notify(text: string, ok = true) {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3500);
  }

  function setField(id: string, field: keyof Victory, value: unknown) {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function uploadImage(id: string, file: File) {
    setUploading(id);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/hall-of-victors/upload", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Falha no upload");
      setField(id, "image_url", j.url);
      await fetch(`/api/hall-of-victors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: j.url }),
      });
      setItems(prev => prev.map(v => v.id === id ? { ...v, image_url: j.url } : v));
    } catch (e) {
      notify(e instanceof Error ? e.message : "Erro no upload", false);
    } finally { setUploading(null); }
  }

  async function approve(v: Victory) {
    const e = edits[v.id] ?? {};
    const finalImage = (e.image_url ?? v.image_url) ?? null;
    if (!finalImage) { notify("Adiciona uma imagem antes de aprovar.", false); return; }
    setBusy(v.id);
    try {
      const res = await fetch(`/api/hall-of-victors/${v.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", ...e }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Falha");
      notify(`Aprovado · ${j.awarded ?? 0} pts atribuídos`);
      setItems(prev => prev.filter(x => x.id !== v.id));
    } catch (err) {
      notify(err instanceof Error ? err.message : "Erro", false);
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
      notify("Rejeitado");
      setItems(prev => prev.filter(x => x.id !== v.id));
    } catch (e) {
      notify(e instanceof Error ? e.message : "Erro", false);
    } finally { setBusy(null); }
  }

  async function removeVictory(v: Victory) {
    if (!window.confirm("Remover esta vitória? Esta ação é irreversível.")) return;
    setBusy(v.id);
    try {
      const res = await fetch(`/api/hall-of-victors/${v.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Falha ao remover");
      notify("Removido");
      setItems(prev => prev.filter(x => x.id !== v.id));
    } catch (e) {
      notify(e instanceof Error ? e.message : "Erro", false);
    } finally { setBusy(null); }
  }

  async function awardPoints(entry: Top3Entry, amount: number) {
    if (!window.confirm(`Dar ${amount} SSE a @${entry.username}?`)) return;
    setAwarding(entry.id);
    try {
      const res = await fetch(`/api/hall-of-victors/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "award_points", amount }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Falha ao premiar");
      notify(`Prémio entregue a @${entry.username} (+${amount} SSE)`);
      setAwarded(prev => ({ ...prev, [entry.id]: true }));
    } catch (e) {
      notify(e instanceof Error ? e.message : "Erro", false);
    } finally { setAwarding(null); }
  }

  const pending  = items.filter(v => v.status === "pending");
  const approved = items.filter(v => v.status === "approved");
  const rejected = items.filter(v => v.status === "rejected");

  const cardProps = (v: Victory) => ({
    v,
    merged:    { ...v, ...(edits[v.id] ?? {}) } as Victory,
    mult:      v.bet_amount && v.bet_amount > 0
                 ? ((edits[v.id]?.win_amount ?? v.win_amount) as number) / v.bet_amount
                 : v.multiplier,
    busy:      busy === v.id,
    uploading: uploading === v.id,
    setField:  (f: keyof Victory, val: unknown) => setField(v.id, f, val),
    onUpload:  (file: File) => uploadImage(v.id, file),
    onApprove: () => approve(v),
    onReject:  () => reject(v),
    onRemove:  () => removeVictory(v),
  });

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-arena-gold-light uppercase tracking-widest">
          Bruta do Mês · Moderação
        </h2>
        <button
          onClick={load}
          className="text-xs text-arena-smoke hover:text-arena-gold-light px-2 py-1 rounded border border-arena-gold/20 hover:border-arena-gold/40 transition-colors"
        >
          ↻ Atualizar
        </button>
      </div>

      {/* Toast */}
      {msg && (
        <div className={`text-sm px-3 py-2 rounded border ${msg.ok ? "border-arena-gold/40 bg-arena-gold/10 text-arena-gold-light" : "border-red-500/40 bg-red-900/20 text-red-400"}`}>
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 sticky top-0 z-10 bg-black/90 py-2 rounded">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-bold uppercase tracking-widest transition-colors ${
              tab === t.key
                ? "bg-arena-gold-light text-black"
                : "bg-black/40 text-arena-gold/60 hover:text-arena-gold-light"
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
            {t.key === "pending"  && pending.length  > 0 && <span className="ml-0.5">({pending.length})</span>}
            {t.key === "approved" && approved.length > 0 && <span className="ml-0.5">({approved.length})</span>}
            {t.key === "rejected" && rejected.length > 0 && <span className="ml-0.5">({rejected.length})</span>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "top3" && (
        <div className="space-y-4">
          <p className="text-xs text-arena-smoke">Premia os vencedores do mês por multiplicador.</p>
          {top3.length === 0 ? (
            <div className="text-arena-smoke italic text-sm">Nenhum vencedor ainda.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {top3.map((entry, i) => (
                <div
                  key={entry.id}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-arena-gold/20 bg-black/40"
                >
                  <span className="text-sm font-bold text-arena-gold">{RANK_LABELS[i]}</span>
                  {entry.avatar_url && (
                    <img src={entry.avatar_url} alt={entry.username} className="w-12 h-12 rounded-full border-2 border-arena-gold/40" />
                  )}
                  <span className="font-bold text-arena-gold-light text-sm">@{entry.username}</span>
                  <span className="text-arena-smoke text-xs">
                    ×{entry.multiplier.toLocaleString("pt-PT", { maximumFractionDigits: 2 })}
                  </span>
                  <button
                    disabled={!!awarded[entry.id] || awarding === entry.id}
                    onClick={() => awardPoints(entry, AWARD_AMOUNTS[i])}
                    className={`w-full mt-1 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 ${
                      i === 0
                        ? "bg-gradient-to-r from-yellow-500 to-yellow-700 text-black"
                        : i === 1
                        ? "bg-gradient-to-r from-slate-300 to-slate-500 text-black"
                        : "bg-gradient-to-r from-orange-700 to-orange-900 text-white"
                    }`}
                  >
                    {awarding === entry.id
                      ? "A premiar…"
                      : awarded[entry.id]
                      ? "✓ Entregue"
                      : `Dar ${AWARD_AMOUNTS[i]} SSE`}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "pending" && (
        <div className="space-y-3">
          {loading && <div className="text-arena-smoke text-sm">A carregar…</div>}
          {!loading && pending.length === 0 && (
            <div className="text-arena-smoke italic text-sm">Nenhuma vitória pendente.</div>
          )}
          {pending.map(v => (
            <VictoryCard key={v.id} {...cardProps(v)} />
          ))}
        </div>
      )}

      {tab === "approved" && (
        <ApprovedList
          items={approved}
          edits={edits}
          busy={busy}
          uploading={uploading}
          loading={loading}
          setField={setField}
          onApprove={approve}
          onReject={reject}
          onRemove={removeVictory}
          onUpload={uploadImage}
        />
      )}

      {tab === "rejected" && (
        <div className="space-y-3">
          {loading && <div className="text-arena-smoke text-sm">A carregar…</div>}
          {!loading && rejected.length === 0 && (
            <div className="text-arena-smoke italic text-sm">Nenhuma vitória rejeitada.</div>
          )}
          {rejected.map(v => (
            <VictoryCard key={v.id} {...cardProps(v)} />
          ))}
        </div>
      )}

    </div>
  );
}

/* ── VictoryCard ───────────────────────────────────────────────────── */
function VictoryCard({
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
    <div className="rounded-xl overflow-hidden border border-arena-gold/30 bg-black/80">
      <div className="grid md:grid-cols-[220px_1fr] gap-0">

        {/* Image slot */}
        <div
          onClick={() => fileRef.current?.click()}
          className="relative aspect-[5/4] md:aspect-auto md:min-h-[180px] bg-black/60 border-b md:border-b-0 md:border-r border-arena-gold/20 cursor-pointer flex items-center justify-center group"
        >
          {merged.image_url ? (
            <>
              <Image src={merged.image_url} alt={merged.slot_name} fill sizes="220px" className="object-cover" unoptimized />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <span className="text-arena-gold-light text-xs uppercase tracking-widest flex items-center gap-1">
                  <Upload size={12} /> {uploading ? "A carregar…" : "Substituir"}
                </span>
              </div>
            </>
          ) : (
            <span className="text-arena-smoke text-xs px-3 text-center flex flex-col items-center gap-1">
              <Upload size={16} className="opacity-50" />
              {uploading ? "A carregar…" : "Clica para adicionar imagem"}
            </span>
          )}
          {v.suspicious && (
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-red-700 text-white z-10">
              ⚠ SUSPEITO
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }}
        />

        {/* Fields */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 text-xs text-arena-smoke">
            <span>
              <span className="text-arena-gold-light font-bold">@{v.username}</span>
              {" · "}{new Date(v.created_at).toLocaleString("pt-PT")}
            </span>
            <span className="font-mono text-arena-gold font-bold">
              ×{mult.toLocaleString("pt-PT", { maximumFractionDigits: 2 })}
            </span>
          </div>

          {merged.url && (
            <a
              href={merged.url} target="_blank" rel="noreferrer"
              className="block truncate text-xs text-blue-400 hover:text-blue-300 underline"
            >
              🔗 {merged.url}
            </a>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Inp label="Slot"      value={merged.slot_name}      onChange={x => setField("slot_name",   x)} />
            <Sel label="Provedor"  value={merged.provider}       onChange={x => setField("provider",    x)} />
            <Inp label="Aposta €"  type="number" value={String(merged.bet_amount ?? "")}
                 onChange={x => setField("bet_amount", parseFloat(x))} />
            <Inp label="Ganho €"   type="number" value={String(merged.win_amount ?? "")}
                 onChange={x => setField("win_amount", parseFloat(x))} />
            <div className="col-span-2">
              <Inp label="Link"    value={merged.url ?? ""}      onChange={x => setField("url",         x)} />
            </div>
          </div>

          {merged.caption && (
            <p className="text-arena-smoke/70 text-xs leading-relaxed border-l border-arena-gold/20 pl-3 italic">
              {merged.caption}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            {v.status !== "approved" && (
              <button
                disabled={busy}
                onClick={onApprove}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest disabled:opacity-50 bg-gradient-to-b from-arena-gold to-yellow-700 text-black transition-opacity"
              >
                <Check size={12} /> Aprovar
              </button>
            )}
            {v.status !== "rejected" && (
              <button
                disabled={busy}
                onClick={onReject}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest disabled:opacity-50 bg-gradient-to-b from-red-700 to-red-900 text-white transition-opacity"
              >
                <X size={12} /> Rejeitar
              </button>
            )}
            <button
              disabled={busy}
              onClick={onRemove}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest disabled:opacity-50 bg-gradient-to-b from-zinc-700 to-zinc-900 text-white transition-opacity"
            >
              <Trash2 size={12} /> Remover
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── ApprovedList ─────────────────────────────────────────────────── */
function ApprovedList({
  items, edits, busy, uploading, loading,
  setField, onApprove, onReject, onRemove, onUpload,
}: {
  items: Victory[];
  edits: Record<string, EditState>;
  busy: string | null;
  uploading: string | null;
  loading: boolean;
  setField: (id: string, f: keyof Victory, val: unknown) => void;
  onApprove: (v: Victory) => void;
  onReject:  (v: Victory) => void;
  onRemove:  (v: Victory) => void;
  onUpload:  (id: string, file: File) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (loading) return <div className="text-arena-smoke text-sm">A carregar…</div>;
  if (items.length === 0) return <div className="text-arena-smoke italic text-sm">Nenhuma vitória aprovada.</div>;

  return (
    <div className="flex flex-col gap-1">
      {items.map(v => {
        const e = edits[v.id] ?? {};
        const merged = { ...v, ...e } as Victory;
        const mult = v.bet_amount && v.bet_amount > 0
          ? ((e.win_amount ?? v.win_amount) as number) / v.bet_amount
          : v.multiplier;
        const isOpen = openId === v.id;

        return (
          <div key={v.id} className="rounded-lg border border-arena-gold/20 overflow-hidden">
            {/* Row */}
            <button
              className="w-full flex items-center justify-between px-3 py-2.5 bg-black/40 hover:bg-arena-gold/[0.06] text-left transition-colors"
              onClick={() => setOpenId(isOpen ? null : v.id)}
            >
              <span className="flex items-center gap-2 min-w-0">
                {v.avatar_url && (
                  <img src={v.avatar_url} alt={v.username} className="w-6 h-6 rounded-full border border-arena-gold/30 shrink-0" />
                )}
                <span className="font-bold text-arena-gold-light text-sm truncate">@{v.username}</span>
                <span className="text-xs text-arena-smoke truncate hidden sm:inline">{v.slot_name}</span>
              </span>
              <span className="flex items-center gap-3 shrink-0 ml-2">
                <span className="text-arena-gold font-mono text-sm">
                  ×{mult.toLocaleString("pt-PT", { maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-arena-smoke hidden sm:inline">
                  {new Date(v.created_at).toLocaleDateString("pt-PT")}
                </span>
                <span className="text-arena-smoke/50 text-xs">{isOpen ? "▲" : "▼"}</span>
              </span>
            </button>

            {/* Expanded card */}
            {isOpen && (
              <div className="border-t border-arena-gold/20">
                <VictoryCard
                  v={v}
                  merged={merged}
                  mult={mult}
                  busy={busy === v.id}
                  uploading={uploading === v.id}
                  setField={(f, val) => setField(v.id, f, val)}
                  onUpload={(file) => onUpload(v.id, file)}
                  onApprove={() => onApprove(v)}
                  onReject={() => onReject(v)}
                  onRemove={() => onRemove(v)}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Field helpers ─────────────────────────────────────────────────── */
function Inp({ label, value, onChange, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-widest text-arena-smoke mb-1">{label}</div>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1.5 rounded bg-black/50 border border-arena-gold/30 text-arena-white text-sm focus:outline-none focus:border-arena-gold-light"
      />
    </label>
  );
}

function Sel({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-widest text-arena-smoke mb-1">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1.5 rounded bg-black/50 border border-arena-gold/30 text-arena-white text-sm"
      >
        {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
        {!PROVIDERS.includes(value as typeof PROVIDERS[number]) && value && (
          <option value={value}>{value}</option>
        )}
      </select>
    </label>
  );
}

