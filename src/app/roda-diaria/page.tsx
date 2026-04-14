import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Roda Diária",
  description: "Roda da sorte diária da Arena Gladiator. Gira e ganha prémios todos os dias!",
};

export default function RodaDiariaPage() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Roda Diária" subtitle="Gira e ganha prémios todos os dias" />
        <div className="mt-12 space-y-6 text-arena-smoke text-lg leading-relaxed">
          <p>Experimenta a roda da sorte diária e ganha prémios exclusivos.</p>
        </div>
      </div>
    </div>
  );
}
