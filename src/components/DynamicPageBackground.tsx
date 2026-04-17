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

  // Only use admin-configured settings
  const bgImage = settings?.background_image || null;
  const overlayOpacity = settings?.overlay_opacity ?? 0.6;
  const effect = settings?.effect ?? "none";
  const effectIntensity = settings?.effect_intensity ?? 1;

  const hasBg = !!bgImage;
  const hasEffect = effect !== "none";
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
              backgroundImage: `url('${bgImage}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              filter: "brightness(0.35) saturate(0.7) contrast(0.95)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }}
          />
        </div>
      )}

      {/* Fixed effect overlay */}
      {hasEffect && (
        <div className="fixed inset-0 z-[1] pointer-events-none">
          <PageEffects
            effect={effect}
            intensity={effectIntensity}
          />
        </div>
      )}
    </>
  );
}

export const DynamicPageBackground = memo(DynamicPageBackgroundInner);
