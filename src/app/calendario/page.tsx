import type { Metadata } from "next";
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
    <div className="pt-24 pb-8 min-h-screen">
      <StreamCalendar />
    </div>
  );
}
