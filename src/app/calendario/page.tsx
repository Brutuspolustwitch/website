import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StreamCalendar } from "@/components/StreamCalendar";

export const metadata: Metadata = {
  title: "Calendário — Agenda de Streams",
  description: "Calendário de streams e eventos da Arena Gladiator. Vê quando é a próxima live!",
  openGraph: {
    title: "Calendário de Streams | Arena Gladiator",
    description: "Agenda completa de streams — próximas lives, bonus hunts, torneios e eventos especiais.",
  },
};

export default function CalendarioPage() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Calendário" subtitle="Agenda de streams e eventos — nunca percas uma live" />
        <div className="mt-10">
          <StreamCalendar />
        </div>
      </div>
    </div>
  );
}
