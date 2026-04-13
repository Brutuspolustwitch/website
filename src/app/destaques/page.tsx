import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { DestaquesContent } from "@/components/DestaquesContent";

export const metadata: Metadata = {
  title: "Destaques — Clips & VODs",
  description: "Os melhores clips e vídeos das streams. Momentos épicos, big wins e highlights atualizados automaticamente via Twitch.",
  openGraph: {
    title: "Destaques — Clips & VODs | Arena Gladiator",
    description: "Os melhores clips e vídeos das streams. Atualizado automaticamente via Twitch.",
  },
};

export default function DestaquesPage() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Destaques"
          subtitle="Clips e VODs do canal — atualizado automaticamente"
        />
        <div className="mt-10">
          <DestaquesContent />
        </div>
      </div>
    </div>
  );
}
