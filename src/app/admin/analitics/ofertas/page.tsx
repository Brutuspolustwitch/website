import type { Metadata } from "next";
import OfferPerformance from "@/components/analytics/OfferPerformance";

export const metadata: Metadata = {
  title: "Ofertas — Analitics",
  description: "Performance de ofertas da Arena Gladiator.",
};

export default function OfferPerformancePage() {
  return <OfferPerformance />;
}
