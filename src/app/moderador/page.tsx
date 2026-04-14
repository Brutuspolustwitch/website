import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Moderador Area",
  description: "Painel de moderação da Arena Gladiator.",
};

export default function ModeradorPage() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Moderador Area" subtitle="Painel de moderação" />
        <div className="mt-12 space-y-6 text-arena-smoke text-lg leading-relaxed">
          <p>Área restrita para moderadores da Arena Gladiator.</p>
        </div>
      </div>
    </div>
  );
}
