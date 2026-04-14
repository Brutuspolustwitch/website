import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Daily Wheel — Admin",
  description: "Gestão da roda diária.",
};

export default function AdminDailyWheelPage() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Daily Wheel" subtitle="Gestão da roda diária" />
        <div className="mt-12 text-arena-smoke text-lg">
          <p>Administração da roda diária — em breve.</p>
        </div>
      </div>
    </div>
  );
}
