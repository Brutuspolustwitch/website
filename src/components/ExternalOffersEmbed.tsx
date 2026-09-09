"use client";

import { useEffect, useId, useRef } from "react";

export function ExternalOffersEmbed() {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = `arena-offers-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useEffect(() => {
    const host = container.current;
    if (!host) return;

    // Each route mount owns its widget. next/script only executes a URL once,
    // which left the second page waiting when navigating between / and /ofertas.
    const mount = document.createElement("div");
    mount.id = widgetId;
    const script = document.createElement("script");
    script.src = "/external-offers-widget.js";
    script.dataset.target = widgetId;
    script.dataset.apiPath = "/api/arena-offers";
    script.onerror = () => {
      mount.textContent = "Ofertas indisponíveis de momento. Atualiza a página para tentar novamente.";
    };
    host.replaceChildren(mount);
    host.appendChild(script);

    return () => host.replaceChildren();
  }, [widgetId]);

  return (
    <section className="relative py-12 sm:py-16">
      <div ref={container} className="min-h-[240px]" aria-live="polite">
        <div className="text-center text-arena-ash py-12">
          A carregar ofertas...
        </div>
      </div>
    </section>
  );
}
