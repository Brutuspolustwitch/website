import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Parcerias — Admin",
  description: "Gestão de parcerias da Arena Gladiator.",
};

export default function ParceriasPage() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Parcerias" subtitle="Gestão de parcerias" />
        <div className="mt-12 text-arena-smoke text-lg">
          <p>Área de gestão de parcerias — em breve.</p>
        </div>
      </div>
    </div>
  );
}
