"use client";

import Script from "next/script";

const DEFAULT_ORIGIN = "https://www.brutuspolus.com";
const DEFAULT_SITE = "arena-dos-bonus";

function normalizeOrigin(value: string | undefined) {
  return (value || DEFAULT_ORIGIN).replace(/\/$/, "");
}

export function ExternalOffersEmbed() {
  const origin = normalizeOrigin(
    process.env.NEXT_PUBLIC_BRUTUSPOLUS_OFFERS_ORIGIN,
  );
  const site = process.env.NEXT_PUBLIC_EXTERNAL_OFFERS_SITE || DEFAULT_SITE;
  const widgetId = "arena-dos-bonus-offers";

  return (
    <section className="relative py-12 sm:py-16">
      <div id={widgetId} className="min-h-[240px]">
        <div className="text-center text-arena-ash py-12">
          A carregar ofertas...
        </div>
      </div>
      <Script
        src={`${origin}/external-offers-widget.js`}
        data-site={site}
        data-api-origin={origin}
        data-target={widgetId}
        strategy="afterInteractive"
      />
    </section>
  );
}
