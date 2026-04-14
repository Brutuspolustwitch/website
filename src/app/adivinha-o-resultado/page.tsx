import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Adivinha o Resultado",
  description: "Adivinha o resultado e ganha prémios na Arena Gladiator.",
};

export default function AdivinhaResultadoPage() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Adivinha o Resultado" subtitle="Testa a tua sorte e intuição" />
        <div className="mt-12 space-y-6 text-arena-smoke text-lg leading-relaxed">
          <p>Adivinha o resultado e compete por prémios com a comunidade.</p>
        </div>
      </div>
    </div>
  );
}
