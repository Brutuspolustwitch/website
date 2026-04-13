import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Loja",
  description: "Loja oficial Arena Gladiator. Merchandising, colecionáveis e artigos exclusivos da comunidade.",
  openGraph: {
    title: "Loja | Arena Gladiator",
    description: "Loja oficial Arena Gladiator.",
  },
};

export default function LojaPage() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Loja" subtitle="Merchandising oficial" />
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="arena-card p-6 text-center">
            <p className="text-arena-smoke">Produtos em breve...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
