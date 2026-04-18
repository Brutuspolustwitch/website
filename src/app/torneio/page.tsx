import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Torneio Liga dos Seca",
  description: "Torneios exclusivos da Liga dos Seca. Compete, sobe no ranking e ganha prémios épicos.",
  openGraph: {
    title: "Torneio Liga dos Seca | Arena Gladiator",
    description: "Torneios exclusivos da Liga dos Seca.",
  },
};

export default function TorneioPage() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-4">
          <div className="arena-card p-6 text-center">
            <p className="text-arena-smoke">Torneios em breve...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
