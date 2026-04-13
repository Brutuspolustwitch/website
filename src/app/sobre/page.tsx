import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Sobre",
  description: "Conhece a história por trás da Arena Gladiator. Quem somos, a nossa missão e o que nos move no mundo do iGaming.",
  openGraph: {
    title: "Sobre | Arena Gladiator",
    description: "Conhece a história por trás da Arena Gladiator.",
  },
};

export default function SobrePage() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Sobre Nós" subtitle="A história por trás da arena" />
        <div className="mt-12 space-y-6 text-arena-smoke text-lg leading-relaxed">
          <p>
            Bem-vindo à Arena Gladiator — a comunidade definitiva de iGaming em português. 
            Nascemos da paixão pelo entretenimento e pela adrenalina dos jogos de casino online.
          </p>
          <p>
            A nossa missão é criar uma experiência única para a comunidade, com streams ao vivo, 
            torneios exclusivos, e as melhores ofertas do mercado.
          </p>
        </div>
      </div>
    </div>
  );
}
