"use client";

import { PageEffects } from "@/components/PageEffects";
import { usePageSettings } from "@/hooks/usePageSettings";
import type { ReactNode } from "react";

interface PageBackgroundProps {
  slug: string;
  children: ReactNode;
  /** Extra classes on the outer wrapper */
  className?: string;
}

/**
 * Wraps a page with its admin-configured background image and effect.
 * Falls back gracefully if no settings exist.
 */
export function PageBackground({ slug, children, className = "" }: PageBackgroundProps) {
  const { settings } = usePageSettings(slug);

  const bgImage = settings?.background_image;
  const effect = settings?.effect ?? "none";
  const intensity = settings?.effect_intensity ?? 1;
  const overlayOpacity = settings?.overlay_opacity ?? 0.6;

  return (
    <div className={`relative min-h-screen overflow-hidden ${className}`}>
      {/* Background image layer */}
      {bgImage && (
        <div className="fixed inset-0 z-0">
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

      {/* Visual effect layer */}
      {effect !== "none" && (
        <div className="fixed inset-0 z-[1] pointer-events-none">
          <PageEffects effect={effect} intensity={intensity} />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
