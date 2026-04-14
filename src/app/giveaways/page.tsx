import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Giveaways",
  description: "Participa nos giveaways da Arena Gladiator e ganha prémios incríveis.",
};

export default function GiveawaysPage() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Giveaways" subtitle="Prémios para a comunidade" />
        <div className="mt-12 space-y-6 text-arena-smoke text-lg leading-relaxed">
          <p>Participa nos giveaways e ganha prémios exclusivos da Arena Gladiator.</p>
        </div>
      </div>
    </div>
  );
}
