import type { Metadata } from "next";
import { SobreContent } from "@/components/SobreContent";

export const metadata: Metadata = {
  title: "Sobre",
  description: "Brutuspolus — o gladiador português do casino. Sem filtros, sem encenação, só a verdade da arena.",
  openGraph: {
    title: "Sobre | Brutuspolus",
    description: "Brutuspolus — o gladiador português do casino. Sem filtros, sem encenação, só a verdade da arena.",
  },
};

export default function SobrePage() {
  return <SobreContent />;
}

