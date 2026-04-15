import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { OfferCards } from "@/components/OfferCard";

export const metadata: Metadata = {
  title: "Ofertas",
  description: "As melhores ofertas e bónus exclusivos dos casinos online. Promoções verificadas e atualizadas.",
  openGraph: {
    title: "Ofertas | Arena Gladiator",
    description: "As melhores ofertas e bónus exclusivos dos casinos online.",
  },
};

export default function OfertasPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Background image — pinned to right side with fade */}
      <div className="fixed inset-0 -z-10">
        {/* Solid black base */}
        <div className="absolute inset-0 bg-black" />
        {/* Image on the right */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/images/pages/offers.webp')",
            backgroundSize: "cover",
            backgroundPosition: "right center",
            backgroundRepeat: "no-repeat",
          }}
        />
        {/* Fade from left (black) into image on right */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-transparent" />
        {/* Top/bottom fade for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
        {/* Subtle warm tint */}
        <div className="absolute inset-0 bg-gradient-to-br from-arena-crimson/5 via-transparent to-transparent" />
        {/* Vignette */}
        <div className="absolute inset-0" style={{ boxShadow: "inset 0 0 200px 60px rgba(0,0,0,0.7)" }} />
      </div>

      {/* Content */}
      <div className="relative pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Ofertas" subtitle="Bónus e promoções exclusivas — clica num cartão para ver detalhes" />
          <OfferCards />
        </div>
      </div>
    </div>
  );
}
