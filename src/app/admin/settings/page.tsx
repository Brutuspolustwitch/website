"use client";

import { useAuth } from "@/lib/auth-context";
import { hasRole } from "@/lib/roles";
import { useEffect, useState, useCallback, useRef } from "react";
import { EFFECT_OPTIONS } from "@/components/PageEffects";
import type { PageSetting } from "@/hooks/usePageSettings";

export default function AdminSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<PageSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<{
    id: string;
    slug: string;
    field: "background_image" | "hero_image";
  } | null>(null);

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
      }
    },
    [showToast]
  );

  /* ── Upload image ───────────────────────────────────────── */
  const handleUpload = useCallback(
    async (file: File) => {
      if (!uploadTarget) return;
      setUploading(uploadTarget.id);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("page_slug", uploadTarget.slug);
        formData.append("field", uploadTarget.field);

        const res = await fetch("/api/upload-image", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Upload failed");
        }

        const { url } = await res.json();
        await saveField(uploadTarget.id, {
          [uploadTarget.field]: url,
        } as Partial<PageSetting>);
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Erro no upload");
      } finally {
        setUploading(null);
        setUploadTarget(null);
      }
    },
    [uploadTarget, saveField, showToast]
  );

  const triggerUpload = (
    id: string,
    slug: string,
    field: "background_image" | "hero_image"
  ) => {
    setUploadTarget({ id, slug, field });
    setTimeout(() => fileInputRef.current?.click(), 50);
  };

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
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
            e.target.value = "";
          }}
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-arena-gold font-[family-name:var(--font-display)]">
            Definições de Páginas
          </h1>
          <p className="mt-2 text-arena-smoke text-sm">
            Configura imagens de fundo e efeitos visuais para cada página do site.
            <br />
            <span className="text-arena-smoke/50">
              Clica em &quot;Carregar imagem&quot; para fazer upload ou &quot;Alterar&quot; para substituir.
              Formatos aceites: JPG, PNG, WebP, GIF (máx. 5 MB).
            </span>
          </p>
        </div>

        {loading ? (
          <div className="text-arena-smoke animate-pulse">A carregar páginas...</div>
        ) : (
          <div className="space-y-4">
            {settings.map((page) => {
              const isHome = page.page_slug === "home";
              const isPageUploading = uploading === page.id;

              return (
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

                    {/* Status badges */}
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {page.effect !== "none" && (
                        <span className="px-2 py-1 rounded-md bg-arena-gold/10 text-arena-gold text-xs font-medium">
                          {EFFECT_OPTIONS.find((e) => e.value === page.effect)?.icon}{" "}
                          {EFFECT_OPTIONS.find((e) => e.value === page.effect)?.label}
                        </span>
                      )}
                      {page.background_image && (
                        <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                          🖼️ Fundo
                        </span>
                      )}
                      {isHome && page.hero_image && (
                        <span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs font-medium">
                          🏛️ Hero
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Config grid */}
                  <div
                    className={`grid grid-cols-1 gap-4 px-5 py-4 border-t border-white/5 ${
                      isHome
                        ? "md:grid-cols-2 lg:grid-cols-4"
                        : "md:grid-cols-3"
                    }`}
                  >
                    {/* Background Image */}
                    <ImageField
                      label="Imagem de Fundo"
                      value={page.background_image}
                      isUploading={
                        isPageUploading &&
                        uploadTarget?.field === "background_image"
                      }
                      onUpload={() =>
                        triggerUpload(
                          page.id,
                          page.page_slug,
                          "background_image"
                        )
                      }
                      onClear={() =>
                        saveField(page.id, {
                          background_image: "",
                        } as Partial<PageSetting>)
                      }
                    />

                    {/* Hero Image — ONLY for home page */}
                    {isHome && (
                      <ImageField
                        label="Imagem Hero (Landing)"
                        value={page.hero_image}
                        isUploading={
                          isPageUploading &&
                          uploadTarget?.field === "hero_image"
                        }
                        onUpload={() =>
                          triggerUpload(
                            page.id,
                            page.page_slug,
                            "hero_image"
                          )
                        }
                        onClear={() =>
                          saveField(page.id, {
                            hero_image: "",
                          } as Partial<PageSetting>)
                        }
                      />
                    )}

                    {/* Effect selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-arena-smoke/70 uppercase tracking-wider">
                        Efeito Visual
                      </label>
                      <div className="grid grid-cols-1 gap-1">
                        {EFFECT_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() =>
                              saveField(page.id, {
                                effect: opt.value,
                              } as Partial<PageSetting>)
                            }
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
                                  s.id === page.id
                                    ? { ...s, effect_intensity: val }
                                    : s
                                )
                              );
                            }}
                            onMouseUp={(e) =>
                              saveField(page.id, {
                                effect_intensity: parseFloat(
                                  (e.target as HTMLInputElement).value
                                ),
                              } as Partial<PageSetting>)
                            }
                            onTouchEnd={(e) =>
                              saveField(page.id, {
                                effect_intensity: parseFloat(
                                  (e.target as HTMLInputElement).value
                                ),
                              } as Partial<PageSetting>)
                            }
                            className="flex-1 accent-[var(--arena-gold,#d4a843)]"
                          />
                          <span className="text-xs text-arena-smoke w-8 text-right">
                            {page.effect_intensity.toFixed(1)}
                          </span>
                        </div>
                      </div>

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
                                  s.id === page.id
                                    ? { ...s, overlay_opacity: val }
                                    : s
                                )
                              );
                            }}
                            onMouseUp={(e) =>
                              saveField(page.id, {
                                overlay_opacity: parseFloat(
                                  (e.target as HTMLInputElement).value
                                ),
                              } as Partial<PageSetting>)
                            }
                            onTouchEnd={(e) =>
                              saveField(page.id, {
                                overlay_opacity: parseFloat(
                                  (e.target as HTMLInputElement).value
                                ),
                              } as Partial<PageSetting>)
                            }
                            className="flex-1 accent-[var(--arena-gold,#d4a843)]"
                          />
                          <span className="text-xs text-arena-smoke w-8 text-right">
                            {(page.overlay_opacity * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      {saving === page.id && (
                        <div className="text-xs text-arena-gold animate-pulse">
                          A guardar...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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

/* ── Image field with upload + preview ─────────────────────── */
function ImageField({
  label,
  value,
  isUploading,
  onUpload,
  onClear,
}: {
  label: string;
  value: string | null;
  isUploading: boolean;
  onUpload: () => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-arena-smoke/70 uppercase tracking-wider">
        {label}
      </label>

      {value ? (
        <div className="space-y-2">
          <div className="relative w-full h-24 rounded-lg overflow-hidden border border-white/10 group">
            <img
              src={value}
              alt={label}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={onUpload}
                className="px-3 py-1.5 rounded-md bg-arena-gold/80 text-black text-xs font-medium hover:bg-arena-gold transition-colors"
              >
                Alterar
              </button>
              <button
                onClick={onClear}
                className="px-3 py-1.5 rounded-md bg-red-500/80 text-white text-xs font-medium hover:bg-red-500 transition-colors"
              >
                Remover
              </button>
            </div>
          </div>
          <p
            className="text-[10px] text-arena-smoke/40 truncate"
            title={value}
          >
            {value}
          </p>
        </div>
      ) : (
        <button
          onClick={onUpload}
          disabled={isUploading}
          className="w-full h-24 rounded-lg border-2 border-dashed border-white/15 hover:border-arena-gold/40 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col items-center justify-center gap-2 group"
        >
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-arena-gold/30 border-t-arena-gold rounded-full animate-spin" />
          ) : (
            <>
              <svg
                className="w-6 h-6 text-arena-smoke/40 group-hover:text-arena-gold/60 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <span className="text-xs text-arena-smoke/40 group-hover:text-arena-smoke/60 transition-colors">
                Carregar imagem
              </span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
