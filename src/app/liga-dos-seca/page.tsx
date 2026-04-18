import type { Metadata } from "next";
import { Suspense } from "react";
import LigaDosBrutusContent from "@/components/LigaDosBrutus";

export const metadata: Metadata = {
  title: "Liga dos Seca",
  description: "Hall of Fame da comunidade — vencedores mensais da Liga dos Seca.",
  openGraph: {
    title: "Liga dos Seca | Arena Gladiator",
    description: "Hall of Fame — os vencedores mensais da Liga dos Seca.",
  },
};

export default function LigaDosBrutusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-arena-gold/30 border-t-arena-gold rounded-full animate-spin" />
      </div>
    }>
      <LigaDosBrutusContent hideTitle />
    </Suspense>
  );
}
