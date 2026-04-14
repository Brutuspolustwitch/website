import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Calendário",
  description: "Calendário de streams e eventos da Arena Gladiator.",
};

export default function CalendarioPage() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Calendário" subtitle="Agenda de streams e eventos" />
        <div className="mt-12 space-y-6 text-arena-smoke text-lg leading-relaxed">
          <p>Consulta o calendário de streams e eventos especiais.</p>
        </div>
      </div>
    </div>
  );
}
