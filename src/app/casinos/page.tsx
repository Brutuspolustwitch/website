import type { Metadata } from "next";
import { CasinoSection } from "@/components/CasinoSection";

export const metadata: Metadata = {
  title: "Casino Reviews",
  description: "Honest casino reviews from the arena. Verified bonuses, ratings, pros and cons for the best iGaming platforms.",
  openGraph: {
    title: "Casino Reviews | Arena Gladiator",
    description: "Handpicked casinos for gladiators.",
  },
};

export default function CasinosPage() {
  return (
    <div className="pt-16">
      <CasinoSection hideTitle />
    </div>
  );
}
