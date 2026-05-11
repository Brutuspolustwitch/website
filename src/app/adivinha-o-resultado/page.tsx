import type { Metadata } from "next";
import { GuessTheSpoils } from "@/components/GuessTheSpoils";

export const metadata: Metadata = {
  title: "Adivinha o Resultado | Guess the Spoils",
  description:
    "Adivinha o resultado do Bonus Hunt e ganha prémios na Arena Gladiator. Survive the Arena and Claim Your Glory!",
  openGraph: {
    title: "Adivinha o Resultado | Arena Gladiator",
    description: "Adivinha o resultado do Bonus Hunt e ganha prémios. Survive the Arena and Claim Your Glory!",
    images: [{ url: "/images/og-image.jpg", width: 1200, height: 630, alt: "Adivinha o Resultado" }],
  },
};

export default function AdivinhaResultadoPage() {
  return (
    <div className="pt-16 min-h-screen">
      <GuessTheSpoils hideTitle />
    </div>
  );
}
