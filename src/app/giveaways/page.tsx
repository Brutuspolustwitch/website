import type { Metadata } from "next";
import GiveawayArena from "@/components/GiveawayArena";

export const metadata: Metadata = {
  title: "Giveaways — Arena Gladiator",
  description: "Participa nos giveaways da Arena Gladiator e ganha prémios incríveis.",
};

export default function GiveawaysPage() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-2xl mx-auto px-3 sm:px-5">
        <GiveawayArena />
      </div>
    </div>
  );
}
