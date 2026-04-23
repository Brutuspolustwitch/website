import type { Metadata } from "next";
import GiveawayAdmin from "@/components/GiveawayAdmin";

export const metadata: Metadata = {
  title: "Giveaways — Admin",
  description: "Criação e gestão de giveaways da arena.",
};

export default function AdminGiveawaysPage() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-4">
          <GiveawayAdmin />
        </div>
      </div>
    </div>
  );
}
