import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Live",
  description: "Assiste à stream ao vivo da Arena Gladiator.",
};

export default function LivePage() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Live" subtitle="Stream ao vivo" />
        <div className="mt-12 space-y-6 text-arena-smoke text-lg leading-relaxed">
          <p>Acompanha a stream ao vivo da Arena Gladiator.</p>
        </div>
      </div>
    </div>
  );
}
