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
      <div className="fixed inset-0 z-0">
        {/* Solid black base */}
        <div className="absolute inset-0 bg-black" />
        {/* Image on the right */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/images/offers.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "right center",
            backgroundRepeat: "no-repeat",
            filter: "brightness(0.35) saturate(0.7) sepia(0.1) contrast(0.95) blur(2px)",
          }}
        />
        {/* Fade from left (black) into image on right */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 pt-24 pb-16">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-6">
          <SectionHeading title="Ofertas" subtitle="Bónus e promoções exclusivas — clica num cartão para ver detalhes" />
          <OfferCards />
        </div>
      </div>
    </div>
  );
}
