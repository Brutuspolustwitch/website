import type { Metadata } from "next";
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
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-1 sm:px-2">
        <div className="mt-4">
          <DestaquesContent />
        </div>
      </div>
    </div>
  );
}
