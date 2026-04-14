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
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Ofertas" subtitle="Bónus e promoções exclusivas — clica num cartão para ver detalhes" />
        <OfferCards />
      </div>
    </div>
  );
}
