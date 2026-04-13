import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";

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
        <div className="mt-12">
          <div className="arena-card p-6 text-center">
            <p className="text-arena-smoke">Liga dos Brutus em breve...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
