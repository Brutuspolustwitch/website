import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { OfferCards } from "@/components/OfferCard";
import { ProfileBanner } from "@/components/ProfileBanner";

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
      {/* Background image — stretched to fill exactly */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: "url('/images/pages/offers.jpg')",
          backgroundSize: "100% 100%",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/50" />
        {/* Crimson tint for on-brand warmth */}
        <div className="absolute inset-0 bg-gradient-to-br from-arena-crimson/10 via-transparent to-arena-black/60" />
        {/* Vignette */}
        <div className="absolute inset-0" style={{ boxShadow: "inset 0 0 150px 40px rgba(0,0,0,0.5)" }} />
      </div>

      {/* Content */}
      <div className="relative pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProfileBanner />
          <SectionHeading title="Ofertas" subtitle="Bónus e promoções exclusivas — clica num cartão para ver detalhes" subtitleClassName="text-black opacity-100" />
          <OfferCards emptyClassName="text-black" />
        </div>
      </div>
    </div>
  );
}
