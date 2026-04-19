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
          <h1 className="hov-hero__title">
            <span className="hov-hero__title-line1">Bruta</span>
            <span className="hov-hero__title-line2">do Mês</span>
          </h1>
          <p className="hov-hero__subtitle">
            A melhor vitória do mês, e as glórias da comunidade
          </p>
          <div className="hov-hero__divider" aria-hidden="true" />
        </div>

        <HallOfVictoriesContent />
      </div>
    </main>
  );
}
