import type { Metadata } from "next";
import { SpinWheel } from "@/components/SpinWheel";

export const metadata: Metadata = {
  title: "Roda Diária",
  description: "Roda da sorte diária da Arena Gladiator. Gira e ganha prémios todos os dias!",
};

export default function RodaDiariaPage() {
  return (
    <div className="h-screen overflow-hidden relative flex flex-col pt-16">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,0,0,0.08),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,rgba(212,168,67,0.05),transparent_50%)]" />

      {/* Header */}
      <div className="relative shrink-0 text-center py-3 lg:py-4">
        <h1 className="font-[family-name:var(--font-display)] text-xl lg:text-2xl font-black uppercase tracking-[0.15em] text-arena-gold">
          Provação Diária da Arena
        </h1>
        <p className="text-[11px] text-arena-ash/60 uppercase tracking-[0.2em] mt-0.5">
          Gira a roda do destino e reivindica a tua glória
        </p>
      </div>

      {/* Main content — fills remaining viewport */}
      <div className="relative flex-1 min-h-0 px-4 sm:px-6 lg:px-8 pb-4">
        <SpinWheel />
      </div>
    </div>
  );
}
