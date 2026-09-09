import type { Metadata } from "next";
import HallOfVictorsArena from "@/components/hov/HallOfVictorsArena";

export const metadata: Metadata = {
  title: "Hall of Victors — Brutas do Mês",
  description: "Champions of the Arena. Top wins of the current month. Submete a tua vitória.",
  openGraph: {
    title: "Hall of Victors | Brutas do Mês",
    description: "Champions of the Arena — Top wins of the current month.",
  },
};

export default function HallOfVictorsPage() {
  return <HallOfVictorsArena />;
}
