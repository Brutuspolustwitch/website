import type { Metadata } from "next";
import HallOfVictoriesContent from "@/components/HallOfVictoriesContent";

export const metadata: Metadata = {
  title: "Bruta do Mês | Brutuspolus",
  description: "A melhor vitória do mês escolhida pela comunidade Brutuspolus. Partilha os teus melhores momentos e recebe honra dos guerreiros.",
  openGraph: {
    title: "Bruta do Mês | Brutuspolus",
    description: "A melhor vitória do mês escolhida pela comunidade Brutuspolus.",
  },
};

export default function HallOfVictoriesPage() {
  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Page title ──────────────────────────────── */}
        <div className="hov-hero">
          <div className="hov-hero__ornament" aria-hidden="true">
            <svg viewBox="0 0 120 24" fill="none" stroke="currentColor" strokeWidth={1}>
              <path d="M8 12 C20 2, 40 2, 54 12 C40 22, 20 22, 8 12Z" />
              <path d="M112 12 C100 2, 80 2, 66 12 C80 22, 100 22, 112 12Z" />
              <line x1="54" y1="12" x2="66" y2="12" />
              <line x1="0" y1="12" x2="6" y2="12" />
              <line x1="114" y1="12" x2="120" y2="12" />
            </svg>
          </div>
          <h1 className="hov-hero__title">
            <span className="hov-hero__title-line1">Bruta</span>
            <span className="hov-hero__title-line2">do Mês</span>
          </h1>
          <p className="hov-hero__subtitle">
            A melhor vitória do mês, eleita pelo admin — e as glórias da comunidade
          </p>
          <div className="hov-hero__divider" aria-hidden="true" />
        </div>

        <HallOfVictoriesContent />
      </div>
    </main>
  );
}
