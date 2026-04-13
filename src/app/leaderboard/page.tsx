import type { Metadata } from "next";
import { Leaderboard } from "@/components/Leaderboard";

export const metadata: Metadata = {
  title: "Gladiator Leaderboard",
  description: "Rise through the gladiator ranks. See the top warriors, champions, and legends of the arena.",
  openGraph: {
    title: "Leaderboard | Arena Gladiator",
    description: "Gladiator ranks and progression.",
  },
};

export default function LeaderboardPage() {
  return (
    <div className="pt-16">
      <Leaderboard />
    </div>
  );
}
