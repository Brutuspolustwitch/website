import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Torneio Liga dos Brutus",
  description: "Torneios exclusivos da Liga dos Brutus. Compete, sobe no ranking e ganha prémios épicos.",
  openGraph: {
    title: "Torneio Liga dos Brutus | Arena Gladiator",
    description: "Torneios exclusivos da Liga dos Brutus.",
  },
};

export default function TorneioPage() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Torneio Liga dos Brutus" subtitle="Compete e conquista a glória" />
        <div className="mt-12">
          <div className="arena-card p-6 text-center">
            <p className="text-arena-smoke">Torneios em breve...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
