import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SpinWheel } from "@/components/SpinWheel";

export const metadata: Metadata = {
  title: "Roda Diária",
  description: "Roda da sorte diária da Arena Gladiator. Gira e ganha prémios todos os dias!",
};

export default function RodaDiariaPage() {
  return (
    <div className="pt-24 pb-16 min-h-screen relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,0,0,0.08),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,rgba(212,168,67,0.05),transparent_50%)]" />

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Provação Diária da Arena"
          subtitle="Gira a roda do destino uma vez por dia e reivindica a tua glória"
        />
        <div className="mt-12">
          <SpinWheel />
        </div>
      </div>
    </div>
  );
}
