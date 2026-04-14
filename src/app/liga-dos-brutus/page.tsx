import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SELeaderboard } from "@/components/SELeaderboard";
import { SEActivityFeed } from "@/components/SEActivityFeed";
import { SETipsFeed } from "@/components/SETipsFeed";

export const metadata: Metadata = {
  title: "Liga dos Brutus",
  description: "Junta-te à Liga dos Brutus — a liga competitiva da comunidade. Rankings, pontos e prémios.",
  openGraph: {
    title: "Liga dos Brutus | Arena Gladiator",
    description: "A liga competitiva da comunidade Arena Gladiator.",
  },
};

export default function LigaDosBrutusPage() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Liga dos Brutus" subtitle="A liga competitiva da comunidade" />

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Leaderboard - main column */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <h2 className="gladiator-title text-xl flex items-center gap-2">
                <span className="text-arena-gold">🏆</span> Top Gladiadores
              </h2>
              <p className="text-sm text-white/50 mt-1">Ranking por pontos de lealdade StreamElements</p>
            </div>
            <SELeaderboard />
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Tips */}
            <div>
              <h2 className="gladiator-title text-xl flex items-center gap-2 mb-4">
                <span>💰</span> Últimas Doações
              </h2>
              <SETipsFeed />
            </div>

            {/* Activity */}
            <div>
              <h2 className="gladiator-title text-xl flex items-center gap-2 mb-4">
                <span>📡</span> Atividade Recente
              </h2>
              <SEActivityFeed />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
