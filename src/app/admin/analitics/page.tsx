import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Analitics — Admin",
  description: "Análises e estatísticas da Arena Gladiator.",
};

export default function AnaliticsPage() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Analitics" subtitle="Estatísticas e análises" />
        <div className="mt-12 text-arena-smoke text-lg">
          <p>Área de análises — em breve.</p>
        </div>
      </div>
    </div>
  );
}
