import type { Metadata } from "next";
import { SpinWheel } from "@/components/SpinWheel";

export const metadata: Metadata = {
  title: "Roda Diária",
  description: "Roda da sorte diária da Arena Gladiator. Gira e ganha prémios todos os dias!",
};

export default function RodaDiariaPage() {
  return (
    <div className="min-h-screen relative pt-16">
      {/* Background image */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/images/pages/wheel-bg.jpg')" }} />
      {/* Dark overlay to keep it moody */}
      <div className="absolute inset-0 bg-black/70" />
      {/* Ambient color gradients on top */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,0,0,0.12),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,rgba(212,168,67,0.08),transparent_50%)]" />

      {/* Header — floats above the SpinWheel background */}
      <div className="absolute top-16 left-0 right-0 z-20 text-center py-3 lg:py-4 pointer-events-none">
        <h1 className="gladiator-title text-xl lg:text-2xl">
          Arrebanha Daily
        </h1>
        <p className="gladiator-subtitle text-[11px] mt-0.5">
          Gira a roda dos campeões e arrebanha a tua glória
        </p>
      </div>

      {/* SpinWheel — fills full area, background covers everything */}
      <div className="relative h-full">
        <SpinWheel />
      </div>
    </div>
  );
}
