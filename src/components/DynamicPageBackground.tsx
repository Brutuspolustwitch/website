"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, memo } from "react";
import { PageEffects } from "@/components/PageEffects";
import type { PageSetting } from "@/hooks/usePageSettings";

/**
 * Renders a fixed background image + visual effect overlay
 * based on the current page's admin-configured settings.
 * Lives in AppShell so it works globally without modifying page files.
 */
function DynamicPageBackgroundInner() {
  const pathname = usePathname();
  const [settings, setSettings] = useState<PageSetting | null>(null);
  const [allSettings, setAllSettings] = useState<PageSetting[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Derive slug from pathname
  const slug = pathname === "/" ? "home" : pathname.replace(/^\//, "").split("/")[0];

  // Fetch all settings once, then use from cache
  useEffect(() => {
    if (loaded) return;
    fetch("/api/page-settings")
      .then((r) => r.json())
      .then((data) => {
        setAllSettings(data.settings ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [loaded]);

  // Update current settings when pathname changes
  useEffect(() => {
    if (!loaded) return;
    const match = allSettings.find((s) => s.page_slug === slug);
    setSettings(match ?? null);
  }, [slug, loaded, allSettings]);

  // Don't render anything if no background/effect configured
  if (!settings) return null;
  const hasBg = !!settings.background_image;
  const hasEffect = settings.effect !== "none";
  if (!hasBg && !hasEffect) return null;

  return (
    <>
      {/* Fixed background image */}
      {hasBg && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-arena-black" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url('${settings.background_image}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              filter: "brightness(0.35) saturate(0.7) contrast(0.95)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{ backgroundColor: `rgba(0,0,0,${settings.overlay_opacity})` }}
          />
        </div>
      )}

      {/* Fixed effect overlay */}
      {hasEffect && (
        <div className="fixed inset-0 z-[1] pointer-events-none">
          <PageEffects
            effect={settings.effect}
            intensity={settings.effect_intensity}
          />
        </div>
      )}
    </>
  );
}

export const DynamicPageBackground = memo(DynamicPageBackgroundInner);
