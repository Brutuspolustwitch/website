"use client";

import { useEffect, useState } from "react";

export interface PageSetting {
  id: string;
  page_slug: string;
  page_name: string;
  background_image: string | null;
  hero_image: string | null;
  effect: "none" | "snow" | "rain" | "thunder" | "fireflies";
  effect_intensity: number;
  overlay_opacity: number;
  bg_brightness: number;
  bg_saturation: number;
  bg_contrast: number;
  updated_at: string;
}

const cache = new Map<string, PageSetting>();

export function usePageSettings(slug: string) {
  const [settings, setSettings] = useState<PageSetting | null>(cache.get(slug) ?? null);
  const [loading, setLoading] = useState(!cache.has(slug));

  useEffect(() => {
    if (cache.has(slug)) {
      setSettings(cache.get(slug)!);
      setLoading(false);
      return;
    }

    let cancelled = false;
    fetch("/api/page-settings")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const all: PageSetting[] = data.settings ?? [];
        // Cache all results
        for (const s of all) cache.set(s.page_slug, s);
        setSettings(all.find((s) => s.page_slug === slug) ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { settings, loading };
}
