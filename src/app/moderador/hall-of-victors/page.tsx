import type { Metadata } from "next";
import ModeratorPanel from "@/components/hov/ModeratorPanel";

export const metadata: Metadata = {
  title: "Hall of Victors — Moderação",
};

export default function HallOfVictorsModerationPage() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <ModeratorPanel />
      </div>
    </div>
  );
}
