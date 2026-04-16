"use client";

import { useAuth } from "@/lib/auth-context";
import { hasRole } from "@/lib/roles";
import { useEffect, useState, useCallback } from "react";
import { EFFECT_OPTIONS } from "@/components/PageEffects";
import type { PageSetting } from "@/hooks/usePageSettings";

type EditingField = {
  id: string;
  field: string;
  value: string;
};

export default function AdminSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<PageSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingField | null>(null);
  const [previewEffect, setPreviewEffect] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  /* ── Fetch settings ─────────────────────────────────────── */
  useEffect(() => {
    fetch("/api/page-settings")
      .then((r) => r.json())
      .then((data) => setSettings(data.settings ?? []))
      .catch(() => showToast("Erro ao carregar definições"))
      .finally(() => setLoading(false));
  }, [showToast]);

  /* ── Save a field ───────────────────────────────────────── */
  const saveField = useCallback(
    async (id: string, updates: Partial<PageSetting>) => {
      setSaving(id);
      try {
        const res = await fetch("/api/page-settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...updates }),
        });
        if (!res.ok) throw new Error("Failed");
        const { setting } = await res.json();
        setSettings((prev) =>
          prev.map((s) => (s.id === id ? { ...s, ...setting } : s))
        );
        showToast("Guardado ✓");
      } catch {
        showToast("Erro ao guardar");
      } finally {
        setSaving(null);
        setEditing(null);
      }
    },
    [showToast]
  );

  /* ── Auth gate ──────────────────────────────────────────── */
  if (authLoading) {
    return (
      <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <div className="text-arena-smoke text-lg animate-pulse">A carregar...</div>
      </div>
    );
  }

  if (!user || !hasRole(user.role, "configurador")) {
    return (
      <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <div className="text-red-400 text-lg">Acesso negado</div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-arena-gold font-[family-name:var(--font-display)]">
            Definições de Páginas
          </h1>
          <p className="mt-2 text-arena-smoke text-sm">
            Configura imagens de fundo, imagem hero e efeitos visuais para cada página do site.
          </p>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-arena-smoke animate-pulse">A carregar páginas...</div>
        ) : (
          <div className="space-y-4">
            {settings.map((page) => (
              <div
                key={page.id}
                className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden"
              >
                {/* Page header row */}
                <div className="flex items-center gap-4 px-5 py-4 bg-white/[0.02]">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-arena-gold font-[family-name:var(--font-display)]">
                      {page.page_name}
                    </h3>
                    <span className="text-xs text-arena-smoke/60 font-mono">
                      /{page.page_slug === "home" ? "" : page.page_slug}
                    </span>
                  </div>

                  {/* Current effect badge */}
                  <div className="flex items-center gap-2">
                    {page.effect !== "none" && (
                      <span className="px-2 py-1 rounded-md bg-arena-gold/10 text-arena-gold text-xs font-medium">
                        {EFFECT_OPTIONS.find((e) => e.value === page.effect)?.icon}{" "}
                        {EFFECT_OPTIONS.find((e) => e.value === page.effect)?.label}
                      </span>
                    )}
                    {page.background_image && (
                      <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                        🖼️ BG
                      </span>
                    )}
                    {page.hero_image && (
                      <span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs font-medium">
                        🏛️ Hero
                      </span>
                    )}
                  </div>
                </div>

                {/* Config grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-5 py-4 border-t border-white/5">
                  {/* Background Image */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-arena-smoke/70 uppercase tracking-wider">
                      Imagem de Fundo
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="/images/pages/..."
                        value={
                          editing?.id === page.id && editing.field === "background_image"
                            ? editing.value
                            : page.background_image ?? ""
                        }
                        onChange={(e) =>
                          setEditing({ id: page.id, field: "background_image", value: e.target.value })
                        }
                        onBlur={() => {
                          if (editing?.id === page.id && editing.field === "background_image") {
                            if (editing.value !== (page.background_image ?? "")) {
                              saveField(page.id, { background_image: editing.value } as Partial<PageSetting>);
                            } else {
                              setEditing(null);
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && editing?.id === page.id && editing.field === "background_image") {
                            saveField(page.id, { background_image: editing.value } as Partial<PageSetting>);
                          }
                        }}
                        className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-arena-white text-sm placeholder:text-white/20 focus:outline-none focus:border-arena-gold/50 transition-colors"
                      />
                    </div>
                    {/* Preview thumbnail */}
                    {page.background_image && (
                      <div className="relative w-full h-16 rounded-md overflow-hidden border border-white/10">
                        <img
                          src={page.background_image}
                          alt="Background preview"
                          className="w-full h-full object-cover opacity-60"
                        />
                      </div>
                    )}
                  </div>

                  {/* Hero Image */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-arena-smoke/70 uppercase tracking-wider">
                      Imagem Hero
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="/images/..."
                        value={
                          editing?.id === page.id && editing.field === "hero_image"
                            ? editing.value
                            : page.hero_image ?? ""
                        }
                        onChange={(e) =>
                          setEditing({ id: page.id, field: "hero_image", value: e.target.value })
                        }
                        onBlur={() => {
                          if (editing?.id === page.id && editing.field === "hero_image") {
                            if (editing.value !== (page.hero_image ?? "")) {
                              saveField(page.id, { hero_image: editing.value } as Partial<PageSetting>);
                            } else {
                              setEditing(null);
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && editing?.id === page.id && editing.field === "hero_image") {
                            saveField(page.id, { hero_image: editing.value } as Partial<PageSetting>);
                          }
                        }}
                        className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-arena-white text-sm placeholder:text-white/20 focus:outline-none focus:border-arena-gold/50 transition-colors"
                      />
                    </div>
                    {page.hero_image && (
                      <div className="relative w-full h-16 rounded-md overflow-hidden border border-white/10">
                        <img
                          src={page.hero_image}
                          alt="Hero preview"
                          className="w-full h-full object-cover opacity-60"
                        />
                      </div>
                    )}
                  </div>

                  {/* Effect selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-arena-smoke/70 uppercase tracking-wider">
                      Efeito Visual
                    </label>
                    <div className="grid grid-cols-1 gap-1">
                      {EFFECT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => saveField(page.id, { effect: opt.value } as Partial<PageSetting>)}
                          disabled={saving === page.id}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all text-left ${
                            page.effect === opt.value
                              ? "bg-arena-gold/20 text-arena-gold border border-arena-gold/30"
                              : "bg-white/5 text-arena-smoke hover:bg-white/10 border border-transparent"
                          }`}
                        >
                          <span>{opt.icon}</span>
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Intensity & Overlay */}
                  <div className="space-y-4">
                    {/* Effect intensity */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-arena-smoke/70 uppercase tracking-wider">
                        Intensidade do Efeito
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0.2"
                          max="2"
                          step="0.1"
                          value={page.effect_intensity}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setSettings((prev) =>
                              prev.map((s) =>
                                s.id === page.id ? { ...s, effect_intensity: val } : s
                              )
                            );
                          }}
                          onMouseUp={(e) => {
                            saveField(page.id, {
                              effect_intensity: parseFloat((e.target as HTMLInputElement).value),
                            } as Partial<PageSetting>);
                          }}
                          onTouchEnd={(e) => {
                            saveField(page.id, {
                              effect_intensity: parseFloat((e.target as HTMLInputElement).value),
                            } as Partial<PageSetting>);
                          }}
                          className="flex-1 accent-[var(--arena-gold,#d4a843)]"
                        />
                        <span className="text-xs text-arena-smoke w-8 text-right">
                          {page.effect_intensity.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    {/* Overlay opacity */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-arena-smoke/70 uppercase tracking-wider">
                        Opacidade do Overlay
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={page.overlay_opacity}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setSettings((prev) =>
                              prev.map((s) =>
                                s.id === page.id ? { ...s, overlay_opacity: val } : s
                              )
                            );
                          }}
                          onMouseUp={(e) => {
                            saveField(page.id, {
                              overlay_opacity: parseFloat((e.target as HTMLInputElement).value),
                            } as Partial<PageSetting>);
                          }}
                          onTouchEnd={(e) => {
                            saveField(page.id, {
                              overlay_opacity: parseFloat((e.target as HTMLInputElement).value),
                            } as Partial<PageSetting>);
                          }}
                          className="flex-1 accent-[var(--arena-gold,#d4a843)]"
                        />
                        <span className="text-xs text-arena-smoke w-8 text-right">
                          {(page.overlay_opacity * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Saving indicator */}
                    {saving === page.id && (
                      <div className="text-xs text-arena-gold animate-pulse">A guardar...</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 px-4 py-2 rounded-lg bg-arena-gold/90 text-black font-medium text-sm shadow-lg animate-[fadeIn_0.2s_ease-out]">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
