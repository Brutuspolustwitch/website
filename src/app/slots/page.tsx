import type { Metadata } from "next";
import { SlotRequestSystem } from "@/components/SlotRequestSystem";

export const metadata: Metadata = {
  title: "Slot Request",
  description: "Request slots for the gladiator to play. Use the !sr command system to queue your favorite slots.",
  openGraph: {
    title: "Slot Request | Arena Gladiator",
    description: "Command the arena — request your slots.",
  },
};

export default function SlotsPage() {
  return (
    <div className="pt-16">
      <SlotRequestSystem />
    </div>
  );
}
