import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SEStore } from "@/components/SEStore";

export const metadata: Metadata = {
  title: "Loja",
  description: "Loja oficial Arena Gladiator. Troca os teus pontos de lealdade por recompensas exclusivas.",
  openGraph: {
    title: "Loja | Arena Gladiator",
    description: "Loja oficial Arena Gladiator — recompensas StreamElements.",
  },
};

export default function LojaPage() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Loja" subtitle="Troca os teus pontos por recompensas exclusivas" />
        <p className="mt-2 text-sm text-white/40 text-center">Os pontos são ganhos assistindo à stream — usa-os aqui para desbloquear itens.</p>
        <div className="mt-12">
          <SEStore />
        </div>
      </div>
    </div>
  );
}
