import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Utilizadores — Admin",
  description: "Gestão de utilizadores da Arena Gladiator.",
};

export default function UtilizadoresPage() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Utilizadores" subtitle="Gestão de utilizadores" />
        <div className="mt-12 text-arena-smoke text-lg">
          <p>Área de gestão de utilizadores — em breve.</p>
        </div>
      </div>
    </div>
  );
}
