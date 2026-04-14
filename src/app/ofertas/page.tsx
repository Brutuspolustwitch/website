import type { Metadata } from "next";
import Image from "next/image";
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
    <div className="relative min-h-screen overflow-hidden">
      {/* Background image — fixed parallax feel */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="/images/offers.jpg"
          alt=""
          fill
          className="object-cover object-right scale-110"
          priority
          quality={85}
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/70" />
        {/* Crimson tint for on-brand warmth */}
        <div className="absolute inset-0 bg-gradient-to-br from-arena-crimson/15 via-transparent to-arena-black/90" />
        {/* Bottom fade into page bg */}
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-arena-black to-transparent" />
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
