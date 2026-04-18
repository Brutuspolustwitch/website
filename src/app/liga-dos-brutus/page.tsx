import type { Metadata } from "next";
import { Suspense } from "react";
import LigaDosBrutusContent from "@/components/LigaDosBrutus";

export const metadata: Metadata = {
  title: "Liga dos Brutus",
  description: "Liga dos Brutus — vencedores mensais da comunidade.",
  openGraph: {
    title: "Liga dos Brutus | Arena Gladiator",
    description: "Liga dos Brutus — os vencedores mensais da comunidade.",
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
