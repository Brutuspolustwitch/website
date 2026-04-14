import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Giveaways — Admin",
  description: "Gestão de giveaways.",
};

export default function AdminGiveawaysPage() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Giveaways" subtitle="Gestão de giveaways" />
        <div className="mt-12 text-arena-smoke text-lg">
          <p>Administração de giveaways — em breve.</p>
        </div>
      </div>
    </div>
  );
}
