import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CasinoReviews } from "@/components/CasinoReviews";

export const metadata: Metadata = {
  title: "Reviews",
  description:
    "Avaliações detalhadas dos casinos online licenciados em Portugal. Índice de segurança, bónus, métodos de pagamento e mais.",
  openGraph: {
    title: "Reviews | Brutus Polus",
    description:
      "Avaliações detalhadas dos casinos online licenciados em Portugal.",
  },
};

export default function ReviewsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-black" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/images/pages/gladiator-arena.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            filter:
              "brightness(0.3) saturate(0.35) sepia(0.25) contrast(0.9) blur(2px)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Reviews"
            subtitle="Avaliações detalhadas dos casinos licenciados em Portugal — segurança, bónus e mais"
          />
          <CasinoReviews />
        </div>
      </div>
    </div>
  );
}
