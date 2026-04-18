import type { Metadata } from "next";
import { Suspense } from "react";
import LigaDosBrutusContent from "@/components/LigaDosBrutus";

export const metadata: Metadata = {
  title: "Liga dos Brutus",
  description: "Hall of Fame da comunidade — vencedores mensais da Liga dos Brutus.",
  openGraph: {
    title: "Liga dos Brutus | Arena Gladiator",
    description: "Hall of Fame — os vencedores mensais da Liga dos Brutus.",
  },
};

export default function LigaDoSecaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-arena-gold/30 border-t-arena-gold rounded-full animate-spin" />
      </div>
    }>
      <LigaDosBrutusContent />
    </Suspense>
  );
}
