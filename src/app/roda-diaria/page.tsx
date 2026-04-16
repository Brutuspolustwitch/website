import type { Metadata } from "next";
import { SpinWheel } from "@/components/SpinWheel";

export const metadata: Metadata = {
  title: "Roda Diária",
  description: "Roda da sorte diária da Arena Gladiator. Gira e ganha prémios todos os dias!",
};

export default function RodaDiariaPage() {
  return (
    <div className="min-h-screen relative pt-16 flex flex-col">
      {/* Background image */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/images/pages/wheel-bg.jpg')" }} />
      {/* Dark overlay to keep it moody */}
      <div className="absolute inset-0 bg-black/70" />
      {/* Ambient color gradients on top */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,0,0,0.12),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,rgba(212,168,67,0.08),transparent_50%)]" />

      {/* SpinWheel — fills remaining area */}
      <div className="relative flex-1 pt-24">
        <SpinWheel />
      </div>
    </div>
  );
}
