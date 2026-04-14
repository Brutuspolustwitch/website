import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Bonus Hunt — Admin",
  description: "Gestão de bonus hunts.",
};

export default function AdminBonusHuntPage() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Bonus Hunt" subtitle="Gestão de bonus hunts" />
        <div className="mt-12 text-arena-smoke text-lg">
          <p>Administração de bonus hunts — em breve.</p>
        </div>
      </div>
    </div>
  );
}
