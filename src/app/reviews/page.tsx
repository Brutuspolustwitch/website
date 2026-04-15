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
    <div className="relative min-h-screen bg-gradient-to-b from-arena-black via-arena-dark to-arena-black">
      {/* Subtle ambient gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,0,0,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(212,168,67,0.05),transparent_50%)]" />
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
