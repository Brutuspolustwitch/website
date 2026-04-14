import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Outros — Admin",
  description: "Outras configurações de administração.",
};

export default function OutrosPage() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Outros" subtitle="Outras configurações" />
        <div className="mt-12 text-arena-smoke text-lg">
          <p>Configurações diversas — em breve.</p>
        </div>
      </div>
    </div>
  );
}
