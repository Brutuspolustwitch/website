import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Calendário — Admin",
  description: "Gestão do calendário.",
};

export default function AdminCalendarioPage() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Calendário" subtitle="Gestão do calendário" />
        <div className="mt-12 text-arena-smoke text-lg">
          <p>Administração do calendário — em breve.</p>
        </div>
      </div>
    </div>
  );
}
