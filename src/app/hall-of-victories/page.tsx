import type { Metadata } from "next";
import HallOfVictorsArena from "@/components/hov/HallOfVictorsArena";

export const metadata: Metadata = {
  title: "Hall of Victors — Bruta do Mês",
  description: "Champions of the Arena. Top wins of the week. Submete a tua vitória.",
  openGraph: {
    title: "Hall of Victors | Bruta do Mês",
    description: "Champions of the Arena — Top wins of the week.",
  },
};

export default function HallOfVictorsPage() {
  return <HallOfVictorsArena />;
}
